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
    const parsedItems = [];
    const errors = [];
    
    console.log(`📊 Processing ${lines.length} lines from CSV`);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip header lines or empty lines
      if (!line || line.startsWith('H') || line.includes('SUPC') || !line.startsWith('P,')) {
        continue;
      }

      try {
        const columns = parseCSVLine(line);
        
        // Expected columns based on the provided structure:
        // [Type, SUPC, CaseQty, SplitQty, Cust#, PackSize, Brand, Description, Mfr#, PerLb, Case$, Each$, ...]
        if (columns.length < 12) {
          errors.push({ line: i + 1, error: 'Insufficient columns', data: line });
          continue;
        }

        const [
          type, supc, caseQty, splitQty, custNum, packSize, 
          brand, description, mfrNum, perLb, casePrice, eachPrice, ...rest
        ] = columns;

        // Skip if no SUPC or description
        if (!supc || !description || supc === 'SUPC' || !description.trim()) {
          console.log(`⚠️ Skipping line ${i + 1}: missing SUPC (${supc}) or description (${description})`);
          continue;
        }

        // Clean description by removing brand name and quotes if it's included
        const cleanDescription = cleanDescriptionFromBrand(
          description?.trim().replace(/^"|"$/g, '') || '', 
          brand?.trim().replace(/^"|"$/g, '') || ''
        );
        
        console.log(`✅ Parsing item ${parsedItems.length + 1}: ${cleanDescription} (Brand: ${brand?.trim() || 'None'})`);
        
        // Smart price parsing
        const caseSize = parseCasePackSize(packSize);
        const casePriceNum = parsePrice(casePrice);
        const eachPriceNum = parsePrice(eachPrice);
        
        // Determine best pricing strategy
        let finalCostPerUnit = 0;
        let finalPricePerCase = casePriceNum;
        
        if (eachPriceNum > 0) {
          // Use each price if available
          finalCostPerUnit = eachPriceNum;
          finalPricePerCase = casePriceNum > 0 ? casePriceNum : (eachPriceNum * caseSize);
        } else if (casePriceNum > 0 && caseSize > 0) {
          // Calculate per-unit from case price
          finalCostPerUnit = casePriceNum / caseSize;
          finalPricePerCase = casePriceNum;
        }
        
        console.log(`💰 Pricing for ${cleanDescription}: Case=$${casePriceNum} (${casePrice}) Each=$${eachPriceNum} (${eachPrice}) → Final: $${finalCostPerUnit}/each`);
        
        const parsedItem = {
          syscoSUPC: supc.trim(),
          name: cleanDescription, // Just the ingredient/item name from description
          description: cleanDescription, // Same as name for now
          brand: brand?.trim() || '',
          syscoCategory: type?.trim() || '',
          casePackSize: caseSize,
          pricePerCase: finalPricePerCase,
          costPerUnit: finalCostPerUnit,
          vendorCode: mfrNum?.trim() || '',
          supplier: 'Sysco',
          unit: 'each', // Default unit
          category: mapSyscoCategory(type?.trim() || '', `${brand?.trim() || ''} ${description?.trim() || ''}`.trim(), description?.trim()),
          // Additional fields for review
          rawData: {
            type, supc, caseQty, splitQty, custNum, packSize,
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
          const existing = await InventoryItem.findOne({
            $or: [
              { syscoSKU: item.syscoSUPC },
              { name: { $regex: new RegExp(item.name, 'i') } }
            ]
          });
          
          return {
            ...item,
            existingItem: existing ? {
              id: existing._id,
              name: existing.name,
              syscoSKU: existing.syscoSKU,
              currentStock: existing.currentStock
            } : null,
            isDuplicate: !!existing
          };
        })
      );

      return NextResponse.json({
        success: true,
        totalParsed: parsedItems.length,
        items: duplicateChecks,
        errors,
        summary: {
          duplicates: duplicateChecks.filter(item => item.isDuplicate).length,
          new: duplicateChecks.filter(item => !item.isDuplicate).length,
          errors: errors.length
        }
      });
    }

    if (action === 'import') {
      // Get selected items to import
      const selectedIndices = JSON.parse(formData.get('selectedItems') as string || '[]');
      const itemsToImport = selectedIndices.map((index: number) => parsedItems[index]);
      
      const imported = [];
      const importErrors = [];

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
            currentStock: 0, // Default to 0, user can update later
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