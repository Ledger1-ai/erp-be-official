import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { InventoryItem } from "@/lib/models/InventoryItem";
import mongoose from "mongoose";

// Parse CSV data and return structured items
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const formData = await request.formData();
    const file = formData.get('csvFile') as File;
    const action = formData.get('action') as string;

    if (!file) {
      return NextResponse.json({ error: 'No CSV file provided' }, { status: 400 });
    }

    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return NextResponse.json({ error: 'Empty CSV file' }, { status: 400 });
    }

    // Parse Sysco CSV format
    const parsedItems: any[] = [];
    const errors: any[] = [];
    let documentLooksLikePurchaseHistory = false;
    
    console.log(`📊 Processing ${lines.length} lines from CSV`);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) continue;

      try {
        const columns = parseCSVLine(line);
        const recordType = (columns[0] || '').replace(/^"|"$/g, '').trim().toUpperCase();

        // Skip non-product lines and header rows
        if (!recordType || recordType === 'H' || recordType === 'F' || recordType !== 'P') {
          continue;
        }

        // Detect format by column count and presence of known headers
        // Format A: Standard purchase order export (e.g., Jul 31 2025 02_41 PM.csv)
        //   [Type, SUPC, CaseQty, SplitQty, Cust#, Pack/Size, Brand, Description, Mfr#, PerLb, Case$, Each$]
        // Format B: Product history export (e.g., Shop_Purchase History_...csv)
        //   [Type, SUPC, CaseQty, SplitQty, Code, Item Status, Replaced Item, Pack, Size, Unit, Brand, Mfr #, Desc, Cat, Case $, Split $, Per Lb, Market, Splittable, Splits, Min Split, Net Wt, Lead Time, Stock, Substitute, Agr, ...]

        const isHistoryFormat = columns.length >= 20; // heuristic
        if (isHistoryFormat) documentLooksLikePurchaseHistory = true;

        let supc = '';
        let packSizeLike = '';
        let brand = '';
        let description = '';
        let mfrNum = '';
        let perLb = '';
        let casePrice = '';
        let eachPrice = '';
        let caseQty = '';
        let splitQty = '';
        let syscoCategoryText = '';

        if (isHistoryFormat) {
          // Product history mapping
          supc = (columns[1] || '').trim();
          caseQty = (columns[2] || '').trim();
          splitQty = (columns[3] || '').trim();
          // Pack is numeric count per case
          const pack = (columns[7] || '').trim();
          const size = (columns[8] || '').trim();
          const unit = (columns[9] || '').trim();
          packSizeLike = pack || '';
          brand = (columns[10] || '').trim();
          mfrNum = (columns[11] || '').trim();
          description = (columns[12] || '').trim();
          syscoCategoryText = (columns[13] || '').trim();
          casePrice = (columns[14] || '').trim();
          eachPrice = (columns[15] || '').trim(); // Split $ behaves like each price
          perLb = (columns[16] || '').trim();

          // Augment description with size if helpful and not already present
          const sizeDescriptor = [size, unit].filter(Boolean).join(' ');
          if (sizeDescriptor && description && !description.toLowerCase().includes(sizeDescriptor.toLowerCase())) {
            description = `${description}`; // keep clean name; size shown in UI via rawData if needed
          }
        } else {
          // Standard purchase order mapping
          supc = (columns[1] || '').trim();
          caseQty = (columns[2] || '').trim();
          splitQty = (columns[3] || '').trim();
          packSizeLike = (columns[5] || '').trim();
          brand = (columns[6] || '').trim();
          description = (columns[7] || '').trim();
          mfrNum = (columns[8] || '').trim();
          perLb = (columns[9] || '').trim();
          casePrice = (columns[10] || '').trim();
          eachPrice = (columns[11] || '').trim();
          syscoCategoryText = recordType; // fallback
        }

        // Validate essential fields
        if (!supc || !description) {
          console.log(`⚠️ Skipping line ${i + 1}: missing SUPC (${supc}) or description (${description})`);
          continue;
        }

        // Clean description by removing brand name and quotes if it's included
        const cleanDescription = cleanDescriptionFromBrand(
          description?.trim().replace(/^"|"$/g, '') || '', 
          brand?.trim().replace(/^"|"$/g, '') || ''
        );

        console.log(`✅ Parsing item ${parsedItems.length + 1}: ${cleanDescription} (Brand: ${brand || 'None'})`);

        // Smart price parsing
        const caseSize = parseCasePackSize(packSizeLike);
        const casePriceNum = parsePrice(casePrice);
        const eachPriceNum = parsePrice(eachPrice);

        // Compute quantities from case/split
        const caseQtyNum = Number(parseFloat((caseQty || '0').toString().replace(/[^0-9.\-]/g, '')) || 0);
        const splitQtyNum = Number(parseFloat((splitQty || '0').toString().replace(/[^0-9.\-]/g, '')) || 0);
        const computedUnits = (Number.isFinite(caseQtyNum) ? caseQtyNum : 0) * (Number.isFinite(caseSize) ? caseSize : 1) + (Number.isFinite(splitQtyNum) ? splitQtyNum : 0);

        // Determine best pricing strategy
        let finalCostPerUnit = 0;
        let finalPricePerCase = casePriceNum;

        if (eachPriceNum > 0) {
          finalCostPerUnit = eachPriceNum;
          finalPricePerCase = casePriceNum > 0 ? casePriceNum : (eachPriceNum * (caseSize || 1));
        } else if (casePriceNum > 0 && caseSize > 0) {
          finalCostPerUnit = casePriceNum / caseSize;
          finalPricePerCase = casePriceNum;
        }

        console.log(`💰 Pricing for ${cleanDescription}: Case=$${casePriceNum} (${casePrice}) Each=$${eachPriceNum} (${eachPrice}) → Final: $${finalCostPerUnit}/each`);

        const parsedItem: any = {
          syscoSUPC: supc,
          name: cleanDescription,
          description: cleanDescription,
          brand: brand || '',
          syscoCategory: syscoCategoryText || recordType,
          casePackSize: caseSize || 1,
          pricePerCase: finalPricePerCase || 0,
          costPerUnit: finalCostPerUnit || 0,
          vendorCode: mfrNum || '',
          supplier: 'Sysco',
          unit: 'each',
          category: mapSyscoCategory(syscoCategoryText || recordType, `${brand || ''} ${description || ''}`.trim(), description || ''),
          caseQty: caseQtyNum,
          splitQty: splitQtyNum,
          computedUnits,
          rawData: isHistoryFormat ? {
            type: recordType, supc, caseQty, splitQty,
            pack: packSizeLike, brand, description, mfrNum, perLb,
            casePrice, splitPrice: eachPrice
          } : {
            type: recordType, supc, caseQty, splitQty, custNum: '', packSize: packSizeLike,
            brand, description, mfrNum, perLb, casePrice, eachPrice
          },
          importStatus: 'pending'
        };

        parsedItems.push(parsedItem);
      } catch (error) {
        errors.push({ 
          line: i + 1, 
          error: error instanceof Error ? error.message : 'Parse error', 
          data: line 
        });
      }
    }

    if (action === 'preview') {
      // Check for duplicates with existing inventory
      const duplicateChecks = await Promise.all(
        parsedItems.map(async (item) => {
          const existing: any = await InventoryItem.findOne({
            $or: [
              { syscoSKU: item.syscoSUPC },
              { name: { $regex: new RegExp(item.name, 'i') } }
            ]
          }).lean();

          // Determine enrichment fields (existing missing/blank/zero but CSV has value)
          const enrichmentFields: string[] = [];
          if (existing) {
            const candidates: Array<[string, any, any]> = [
              ['syscoSKU', existing.syscoSKU, item.syscoSUPC],
              ['vendorSKU', existing.vendorSKU, item.syscoSUPC],
              ['casePackSize', Number(existing.casePackSize || 0), Number(item.casePackSize || 0)],
              ['vendorCode', existing.vendorCode, item.vendorCode],
              ['syscoCategory', existing.syscoCategory, item.syscoCategory],
              ['pricePerCase', Number(existing.pricePerCase || 0), Number(item.pricePerCase || 0)],
              ['costPerUnit', Number(existing.costPerUnit || 0), Number(item.costPerUnit || 0)],
              ['brand', existing.brand, item.brand],
              ['description', existing.description, item.description],
            ];
            for (const [field, oldVal, newVal] of candidates) {
              const hasOld = typeof oldVal === 'number' ? oldVal > 0 : !!(oldVal && String(oldVal).trim());
              const hasNew = typeof newVal === 'number' ? newVal > 0 : !!(newVal && String(newVal).trim());
              if (!hasOld && hasNew) enrichmentFields.push(field);
            }
          }
          
          return {
            ...item,
            existingItem: existing ? {
              id: existing._id,
              name: existing.name,
              syscoSKU: existing.syscoSKU,
              currentStock: existing.currentStock
            } : null,
            isDuplicate: !!existing,
            canEnrich: existing ? enrichmentFields.length > 0 : false,
            enrichmentFields,
          };
        })
      );

      return NextResponse.json({
        success: true,
        totalParsed: parsedItems.length,
        isHistoryFormat: documentLooksLikePurchaseHistory,
        items: duplicateChecks,
        errors,
        summary: {
          duplicates: duplicateChecks.filter((item: any) => item.isDuplicate).length,
          new: duplicateChecks.filter((item: any) => !item.isDuplicate).length,
          errors: errors.length
        }
      });
    }

    if (action === 'import') {
      // Get selected items to import
      const selectedIndices = JSON.parse(formData.get('selectedItems') as string || '[]');
      const duplicateResolutions = JSON.parse((formData.get('duplicateResolutions') as string) || '{}');
      const enrichmentResolutions = JSON.parse((formData.get('enrichmentResolutions') as string) || '{}');
      const itemsToImport = selectedIndices.map((index: number) => parsedItems[index]);
      
      const imported: any[] = [];
      const importErrors: any[] = [];

      // First, process duplicates replacement requests regardless of selection
      try {
        for (const dup of parsedItems) {
          const supc = String(dup?.syscoSUPC || '').trim();
          const wantsReplace = !!duplicateResolutions[supc];
          const wantsEnrich = !!enrichmentResolutions[supc];
          if (!wantsReplace) continue;
          const existing = await InventoryItem.findOne({
            $or: [
              { syscoSKU: supc },
              { name: { $regex: new RegExp(dup.name, 'i') } }
            ]
          });
          if (existing) {
            const before = Number(existing.currentStock || 0);
            const after = Number(dup.computedUnits || 0);
            existing.currentStock = after;
            existing.lastUpdated = new Date();
            if (wantsEnrich) {
              // Apply enrichment for missing fields
              const applyIfMissing = (field: string, newVal: any) => {
                const oldVal: any = (existing as any)[field];
                const hasOld = typeof oldVal === 'number' ? oldVal > 0 : !!(oldVal && String(oldVal).trim());
                const hasNew = typeof newVal === 'number' ? newVal > 0 : !!(newVal && String(newVal).trim());
                if (!hasOld && hasNew) (existing as any)[field] = newVal;
              };
              applyIfMissing('syscoSKU', dup.syscoSUPC);
              applyIfMissing('vendorSKU', dup.syscoSUPC);
              applyIfMissing('casePackSize', Number(dup.casePackSize || 0));
              applyIfMissing('vendorCode', dup.vendorCode);
              applyIfMissing('syscoCategory', dup.syscoCategory);
              applyIfMissing('pricePerCase', Number(dup.pricePerCase || 0));
              applyIfMissing('costPerUnit', Number(dup.costPerUnit || 0));
              applyIfMissing('brand', dup.brand);
              applyIfMissing('description', dup.description);
            }
            await existing.save();
            imported.push({ id: existing._id, name: existing.name, syscoSKU: existing.syscoSKU, replacedCount: true, before, after });
          }
        }
      } catch (e: any) {
        importErrors.push({ item: 'duplicates', error: e?.message || 'Failed to apply duplicate replacements' });
      }

      for (const item of itemsToImport) {
        try {
          // Check if item already exists
          const existing = await InventoryItem.findOne({
            $or: [
              { syscoSKU: item.syscoSUPC },
              { name: { $regex: new RegExp(item.name, 'i') } }
            ]
          });

          if (existing) {
            // If the duplicate wasn't opted-in for replacement above, skip creating
            importErrors.push({
              item: item.name,
              error: 'Item already exists',
              existingId: existing._id
            });
            continue;
          }

          // Create new inventory item
          const newItem = new InventoryItem({
            name: item.name,
            description: item.description,
            category: item.category,
            syscoSKU: item.syscoSUPC,
            vendorSKU: item.syscoSUPC,
            syscoCategory: item.syscoCategory,
            casePackSize: item.casePackSize,
            pricePerCase: item.pricePerCase,
            costPerUnit: item.costPerUnit,
            vendorCode: item.vendorCode,
            supplier: item.supplier,
            unit: item.unit,
            currentStock: 0, // Keep 0 for new items to avoid unintended inventory jumps
            minThreshold: 10, // Default threshold
            maxCapacity: 100, // Default capacity
            preferredVendor: 'Sysco',
            notes: `Imported from Sysco CSV on ${new Date().toISOString()}`,
            createdBy: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') // System user ID
          });

          const savedItem = await newItem.save();
          console.log('✅ Successfully saved item:', savedItem.name, 'ID:', savedItem._id);
          
          imported.push({
            id: savedItem._id,
            name: savedItem.name,
            syscoSKU: savedItem.syscoSKU
          });
        } catch (error) {
          console.error('❌ Import error for item:', item.name);
          console.error('Error details:', error);
          console.error('Item data:', JSON.stringify(item, null, 2));
          
          // Extract validation errors if available
          let errorMessage = 'Import failed';
          if (error instanceof Error) {
            errorMessage = error.message;
            if ('errors' in error) {
              const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
              errorMessage = `Validation failed: ${validationErrors.join(', ')}`;
            }
          }
          
          importErrors.push({
            item: item.name,
            error: errorMessage,
            details: error instanceof Error ? error.stack : String(error)
          });
        }
      }

    console.log(`📊 Parsing complete: ${parsedItems.length} items parsed, ${errors.length} errors`);

    return NextResponse.json({
        success: true,
        imported: imported.length,
        items: imported,
        errors: importErrors,
        summary: {
          attempted: itemsToImport.length,
          successful: imported.length,
          failed: importErrors.length
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json({ 
      error: 'Failed to process CSV', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Helper function to parse CSV line respecting quotes
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Helper function to parse case pack size from pack/size string
function parseCasePackSize(packSize: string): number {
  if (!packSize) return 1;
  
  // Extract number from strings like "4/1GAL", "12/1.5 LT", etc.
  const match = packSize.match(/^(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

// Helper function to parse price strings
function parsePrice(priceStr: string): number {
  if (!priceStr || priceStr.trim() === '') return 0;
  
  // Handle "MARKET" values
  if (priceStr.trim().toUpperCase() === 'MARKET') return 0;
  
  // Remove currency symbols and parse
  const cleanPrice = priceStr.replace(/[$,]/g, '').trim();
  const price = parseFloat(cleanPrice);
  return isNaN(price) ? 0 : price;
}

// Helper function to remove brand name from description if it's duplicated
function cleanDescriptionFromBrand(description: string, brand: string): string {
  if (!description || !brand) return description;
  
  // Remove brand from the beginning of description (case insensitive)
  const brandPattern = new RegExp(`^${brand.trim()}\\s*`, 'i');
  let cleaned = description.replace(brandPattern, '').trim();
  
  // Also check if brand appears at the end and remove it
  const brandEndPattern = new RegExp(`\\s*${brand.trim()}$`, 'i');
  cleaned = cleaned.replace(brandEndPattern, '').trim();
  
  // Return cleaned description, or original if cleaning resulted in empty string
  return cleaned || description;
}

// Helper function to map Sysco categories to our inventory categories
function mapSyscoCategory(syscoType: string, itemName?: string, description?: string): string {
  const fullText = `${itemName || ''} ${description || ''}`.toLowerCase();
  
  // Smart categorization based on product name/description
  if (fullText.includes('chicken') || fullText.includes('beef') || fullText.includes('salmon') || 
      fullText.includes('fish') || fullText.includes('meat') || fullText.includes('protein') ||
      fullText.includes('pangasius') || fullText.includes('diced') || fullText.includes('breast')) {
    return 'Proteins';
  }
  
  if (fullText.includes('cheese') || fullText.includes('cream') || fullText.includes('butter') ||
      fullText.includes('milk') || fullText.includes('dairy') || fullText.includes('whipping')) {
    return 'Dairy';
  }
  
  if (fullText.includes('syrup') || fullText.includes('soda') || fullText.includes('juice') ||
      fullText.includes('sprite') || fullText.includes('coke') || fullText.includes('pepper')) {
    return 'Beverages';
  }
  
  if (fullText.includes('lettuce') || fullText.includes('tomato') || fullText.includes('onion') ||
      fullText.includes('cabbage') || fullText.includes('potato') || fullText.includes('celery') ||
      fullText.includes('mushroom') || fullText.includes('broccoli') || fullText.includes('garlic') ||
      fullText.includes('cucumber') || fullText.includes('cauliflower') || fullText.includes('brussel')) {
    return 'Vegetables';
  }
  
  if (fullText.includes('bread') || fullText.includes('tortilla') || fullText.includes('roll') ||
      fullText.includes('bun') || fullText.includes('brioche')) {
    return 'Bakery';
  }
  
  if (fullText.includes('sauce') || fullText.includes('dressing') || fullText.includes('mayo') ||
      fullText.includes('ketchup') || fullText.includes('honey') || fullText.includes('pepper cayenne') ||
      fullText.includes('ranch') || fullText.includes('sambal') || fullText.includes('pumpkin seed') ||
      fullText.includes('olive') || fullText.includes('mayonnaise')) {
    return 'Condiments';
  }
  
  if (fullText.includes('container') || fullText.includes('paper') || fullText.includes('plastic') ||
      fullText.includes('takeout') || fullText.includes('label')) {
    return 'Packaging';
  }
  
  if (fullText.includes('brownie') || fullText.includes('cream vanilla') || fullText.includes('ice cream')) {
    return 'Desserts';
  }
  
  // Fallback to type code mapping
  const typeMap: { [key: string]: string } = {
    'P': 'Proteins',
    'F': 'Proteins', // Frozen proteins
    'D': 'Dairy',
    'B': 'Beverages',
    'S': 'Spices',
    'V': 'Vegetables',
  };
  
  return typeMap[syscoType?.toUpperCase()] || 'Other';
}