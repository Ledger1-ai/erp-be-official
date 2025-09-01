import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
// AI Insights
export const GET_AI_INSIGHTS = gql`
  query AIInsights($module: String, $forDate: Date, $status: String) {
    aiInsights(module: $module, forDate: $forDate, status: $status) {
      id
      module
      title
      description
      action
      urgency
      impact
      status
      createdAt
      forDate
      createdBy
    }
  }
`;

export const GENERATE_INSIGHTS = gql`
  mutation GenerateInsights($module: String!, $forDate: Date) {
    generateInsights(module: $module, forDate: $forDate)
  }
`;

export const DISMISS_INSIGHT = gql`
  mutation DismissInsight($id: ID!) {
    dismissInsight(id: $id)
  }
`;

export const useAIInsights = (module?: string, forDate?: string, status?: string) =>
  useQuery(GET_AI_INSIGHTS, { variables: { module, forDate, status } });
export const useGenerateInsights = () => useMutation(GENERATE_INSIGHTS);
export const useDismissInsight = () => useMutation(DISMISS_INSIGHT, { refetchQueries: ['AIInsights'] });

// Team Members
export const GET_TEAM_MEMBERS = gql`
  query GetTeamMembers {
    teamMembers {
      id
      name
      email
      phone
      role
      department
      status
      joinDate
      hourlyRate
      availability
      skills
      performance {
        rating
        completedShifts
        onTimeRate
        customerRating
        salesGenerated
      }
      toastId
    }
  }
`;

export const GET_TEAM_MEMBER = gql`
  query GetTeamMember($id: ID!) {
    teamMember(id: $id) {
      id
      name
      email
      phone
      role
      department
      status
      joinDate
      hourlyRate
      availability
      skills
      performance {
        rating
        completedShifts
        onTimeRate
        customerRating
        salesGenerated
      }
      toastId
    }
  }
`;

export const CREATE_TEAM_MEMBER = gql`
  mutation CreateTeamMember($input: CreateTeamMemberInput!) {
    createTeamMember(input: $input) {
      id
      name
      email
      role
      department
    }
  }
`;

export const UPDATE_TEAM_MEMBER = gql`
  mutation UpdateTeamMember($id: ID!, $input: UpdateTeamMemberInput!) {
    updateTeamMember(id: $id, input: $input) {
      id
      name
      email
      role
      department
      status
    }
  }
`;

export const DELETE_TEAM_MEMBER = gql`
  mutation DeleteTeamMember($id: ID!) {
    deleteTeamMember(id: $id)
  }
`;

// Inventory Items
export const GET_INVENTORY_ITEMS = gql`
  query GetInventoryItems {
    inventoryItems {
      id
      name
      category
      currentStock
      minThreshold
      parLevel
      maxCapacity
      unit
      costPerUnit
      supplier
      lastUpdated
      status
      location
      barcode
      qrCode
      description
      expiryDate
      waste
      reorderPoint
      reorderQuantity
      averageDailyUsage
      restockPeriod
      restockDays
      syscoSKU
      vendorSKU
      casePackSize
      vendorCode
      syscoCategory
      leadTimeDays
      minimumOrderQty
      pricePerCase
      lastOrderDate
      preferredVendor
      alternateVendors
      averageDailyUsage
      seasonalItem
      notes
      brand
      wasteLogs {
        id
        date
        quantity
        reason
        notes
      }
    }
  }
`;

export const GET_INVENTORY_ITEM = gql`
  query GetInventoryItem($id: ID!) {
    inventoryItem(id: $id) {
      id
      name
      category
      currentStock
      minThreshold
      parLevel
      maxCapacity
      unit
      costPerUnit
      supplier
      lastUpdated
      status
      location
      barcode
      qrCode
      description
      expiryDate
      waste
      reorderPoint
      reorderQuantity
      averageDailyUsage
      restockPeriod
      restockDays
    }
  }
`;

export const GET_LOW_STOCK_ITEMS = gql`
  query GetLowStockItems {
    lowStockItems {
      id
      name
      category
      currentStock
      minThreshold
      unit
      costPerUnit
      status
    }
  }
`;

export const CREATE_INVENTORY_ITEM = gql`
  mutation CreateInventoryItem($input: CreateInventoryItemInput!) {
    createInventoryItem(input: $input) {
      id
      name
      category
      currentStock
      minThreshold
      unit
      costPerUnit
      supplier
      status
    }
  }
`;

export const UPDATE_INVENTORY_ITEM = gql`
  mutation UpdateInventoryItem($id: ID!, $input: UpdateInventoryItemInput!) {
    updateInventoryItem(id: $id, input: $input) {
      id
      name
      category
      currentStock
      minThreshold
      unit
      costPerUnit
      supplier
      status
    }
  }
`;

export const UPDATE_STOCK = gql`
  mutation UpdateStock($id: ID!, $quantity: Float!) {
    updateStock(id: $id, quantity: $quantity) {
      id
      currentStock
      status
      lastUpdated
    }
  }
`;

export const DELETE_INVENTORY_ITEM = gql`
  mutation DeleteInventoryItem($id: ID!) {
    deleteInventoryItem(id: $id)
  }
`;

export const RECORD_WASTE = gql`
  mutation RecordWaste($itemId: ID!, $quantity: Float!, $reason: String!, $notes: String) {
    recordWaste(itemId: $itemId, quantity: $quantity, reason: $reason, notes: $notes) {
      id
      currentStock
      wasteLogs {
        id
        date
        quantity
        reason
        notes
      }
    }
  }
`;

// Vendors
export const GET_VENDORS = gql`
  query GetVendors {
    vendors {
      id
      name
      companyName
      supplierCode
      type
      categories
      status
      notes
      isPreferred
      currentRepresentative { name title email phone mobile startDate notes }
      representativeHistory { 
        representative { name title email phone mobile startDate notes }
        fromDate
        toDate
        reason
        changedBy
        changedAt
      }
      deliveryInfo { deliveryDays deliveryWindow minimumOrder leadTimeDays }
      performanceMetrics { onTimeDeliveryRate qualityRating totalOrders totalSpent }
      contacts { name title email phone mobile isPrimary }
      address { street city state zipCode country }
      paymentTerms { terms customTerms creditLimit currentBalance currency }
      certifications
      documents { name type url uploadDate expiryDate }
    }
  }
`;

export const CREATE_VENDOR = gql`
  mutation CreateVendor($input: CreateVendorInput!) {
    createVendor(input: $input) {
      id
      name
      companyName
      supplierCode
      status
      notes
      isPreferred
    }
  }
`;

export const UPDATE_VENDOR = gql`
  mutation UpdateVendor($id: ID!, $input: UpdateVendorInput!) {
    updateVendor(id: $id, input: $input) {
      id
      name
      companyName
      supplierCode
      status
      notes
      isPreferred
    }
  }
`;

export const DELETE_VENDOR = gql`
  mutation DeleteVendor($id: ID!) {
    deleteVendor(id: $id)
  }
`;

export const UPDATE_VENDOR_REPRESENTATIVE = gql`
  mutation UpdateVendorRepresentative($id: ID!, $input: UpdateVendorRepresentativeInput!) {
    updateVendorRepresentative(id: $id, input: $input) {
      id
      currentRepresentative { name title email phone mobile startDate notes }
      representativeHistory { toDate reason changedAt }
    }
  }
`;

// Shifts
export const GET_SHIFTS = gql`
  query GetShifts($startDate: Date, $endDate: Date) {
    shifts(startDate: $startDate, endDate: $endDate) {
      id
      date
      startTime
      endTime
      role
      assignedTo
      status
      notes
      actualStartTime
      actualEndTime
      breakTime
      teamMember {
        id
        name
        email
        role
      }
    }
  }
`;

export const GET_SHIFT = gql`
  query GetShift($id: ID!) {
    shift(id: $id) {
      id
      date
      startTime
      endTime
      role
      assignedTo
      status
      notes
      actualStartTime
      actualEndTime
      breakTime
      teamMember {
        id
        name
        email
        role
      }
    }
  }
`;

export const CREATE_SHIFT = gql`
  mutation CreateShift($input: CreateShiftInput!) {
    createShift(input: $input) {
      id
      date
      startTime
      endTime
      role
      assignedTo
      status
    }
  }
`;

export const UPDATE_SHIFT = gql`
  mutation UpdateShift($id: ID!, $input: UpdateShiftInput!) {
    updateShift(id: $id, input: $input) {
      id
      date
      startTime
      endTime
      role
      assignedTo
      status
    }
  }
`;

export const DELETE_SHIFT = gql`
  mutation DeleteShift($id: ID!) {
    deleteShift(id: $id)
  }
`;

// Invoices
export const GET_INVOICES = gql`
  query GetInvoices {
    invoices {
      id
      invoiceNumber
      clientName
      clientEmail
      clientPhone
      amount
      tax
      totalAmount
      dueDate
      status
      issuedDate
      paidDate
      description
      paymentMethod
      notes
      terms
    }
  }
`;

// Orders
export const GET_PURCHASE_ORDERS = gql`
  query GetPurchaseOrders($vendorId: ID, $status: String) {
    purchaseOrders(vendorId: $vendorId, status: $status) {
      id
      poNumber
      supplierName
      supplier { id name companyName supplierCode }
      status
      expectedDeliveryDate
      subtotal
      total
      creditTotal
      createdAt
      items { inventoryItem name vendorSKU sku unit unitCost quantityOrdered quantityReceived creditedQuantity totalCost }
    }
  }
`;

export const CREATE_PURCHASE_ORDER = gql`
  mutation CreatePurchaseOrder($input: CreatePurchaseOrderInput!) {
    createPurchaseOrder(input: $input) {
      id
      poNumber
      status
    }
  }
`;

export const UPDATE_PURCHASE_ORDER = gql`
  mutation UpdatePurchaseOrder($id: ID!, $input: UpdatePurchaseOrderInput!) {
    updatePurchaseOrder(id: $id, input: $input) { id poNumber status }
  }
`;

export const RECEIVE_PURCHASE_ORDER = gql`
  mutation ReceivePurchaseOrder($id: ID!, $receipts: [ReceiveItemInput!]!) {
    receivePurchaseOrder(id: $id, receipts: $receipts) {
      order { id poNumber status }
      missing { name missingQuantity unitCost totalCredit }
      totalCredit
      replacementOrder { id poNumber status }
    }
  }
`;

export const RESET_PURCHASE_ORDER = gql`
  mutation ResetPurchaseOrder($id: ID!) {
    resetPurchaseOrder(id: $id) {
      id
      poNumber
      status
      items { name quantityOrdered quantityReceived creditedQuantity unitCost totalCost }
    }
  }
`;

export const DELETE_PURCHASE_ORDER = gql`
  mutation DeletePurchaseOrder($id: ID!) {
    deletePurchaseOrder(id: $id)
  }
`;

export const GET_INVOICE = gql`
  query GetInvoice($id: ID!) {
    invoice(id: $id) {
      id
      invoiceNumber
      clientName
      clientEmail
      clientPhone
      amount
      tax
      totalAmount
      dueDate
      status
      issuedDate
      paidDate
      description
      paymentMethod
      notes
      terms
    }
  }
`;

export const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      id
      invoiceNumber
      clientName
      amount
      totalAmount
      dueDate
      status
      issuedDate
    }
  }
`;

export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice($id: ID!, $input: UpdateInvoiceInput!) {
    updateInvoice(id: $id, input: $input) {
      id
      clientName
      amount
      totalAmount
      dueDate
      status
    }
  }
`;

export const MARK_INVOICE_PAID = gql`
  mutation MarkInvoicePaid($id: ID!) {
    markInvoicePaid(id: $id) {
      id
      status
      paidDate
    }
  }
`;

export const DELETE_INVOICE = gql`
  mutation DeleteInvoice($id: ID!) {
    deleteInvoice(id: $id)
  }
`;

// Menus & Mappings
export const INDEX_MENUS = gql`
  mutation IndexMenus($restaurantGuid: String!) {
    indexMenus(restaurantGuid: $restaurantGuid)
  }
`;

export const GET_INDEXED_MENUS = gql`
  query IndexedMenus($restaurantGuid: String!) {
    indexedMenus(restaurantGuid: $restaurantGuid) {
      restaurantGuid
      lastUpdated
      menus { guid name description menuGroups { guid name description menuItems { guid name description price pricingStrategy taxInclusion modifierGroupReferences } menuGroups { guid name description } } }
      modifierGroupReferences { referenceId guid name pricingStrategy modifierOptionReferences }
      modifierOptionReferences { referenceId guid name price pricingStrategy }
    }
  }
`;

export const GET_MENU_VISIBILITY = gql`
  query MenuVisibility($restaurantGuid: String!) {
    menuVisibility(restaurantGuid: $restaurantGuid) {
      restaurantGuid
      hiddenMenus
      hiddenGroups
      updatedAt
    }
  }
`;

export const GET_MENU_MAPPINGS = gql`
  query MenuMappings($restaurantGuid: String!, $toastItemGuid: String) {
    menuMappings(restaurantGuid: $restaurantGuid, toastItemGuid: $toastItemGuid) {
      id
      restaurantGuid
      toastItemGuid
      toastItemName
      components { kind inventoryItem nestedToastItemGuid quantity unit notes overrides { kind inventoryItem nestedToastItemGuid quantity unit notes } }
      recipeSteps { step instruction time notes }
      computedCostCache
      lastComputedAt
    }
  }
`;

export const UPSERT_MENU_MAPPING = gql`
  mutation UpsertMenuMapping($input: UpsertMenuMappingInput!) {
    upsertMenuMapping(input: $input) {
      id
      restaurantGuid
      toastItemGuid
      components { kind inventoryItem nestedToastItemGuid quantity unit notes overrides { kind inventoryItem nestedToastItemGuid quantity unit notes } }
      recipeSteps { step instruction time notes }
    }
  }
`;

export const GET_MENU_ITEM_COST = gql`
  query MenuItemCost($restaurantGuid: String!, $toastItemGuid: String!) {
    menuItemCost(restaurantGuid: $restaurantGuid, toastItemGuid: $toastItemGuid)
  }
`;

export const GET_MENU_ITEM_CAPACITY = gql`
  query MenuItemCapacity($restaurantGuid: String!, $toastItemGuid: String!, $quantity: Float) {
    menuItemCapacity(restaurantGuid: $restaurantGuid, toastItemGuid: $toastItemGuid, quantity: $quantity) {
      capacity
      allHaveStock
      requirements { inventoryItem unit quantityPerOrder available }
    }
  }
`;

export const GET_MENU_ITEM_STOCK = gql`
  query MenuItemStock($restaurantGuid: String!, $guids: [String!], $multiLocationIds: [String!]) {
    menuItemStock(restaurantGuid: $restaurantGuid, guids: $guids, multiLocationIds: $multiLocationIds) {
      guid
      multiLocationId
      status
      quantity
      versionId
    }
  }
`;

export const UPDATE_MENU_ITEM_STOCK = gql`
  mutation UpdateMenuItemStock($restaurantGuid: String!, $updates: [MenuItemStockUpdateInput!]!) {
    updateMenuItemStock(restaurantGuid: $restaurantGuid, updates: $updates) {
      guid
      multiLocationId
      status
      quantity
      versionId
    }
  }
`;

export const SET_MENU_VISIBILITY = gql`
  mutation SetMenuVisibility($restaurantGuid: String!, $hiddenMenus: [String!], $hiddenGroups: [String!]) {
    setMenuVisibility(restaurantGuid: $restaurantGuid, hiddenMenus: $hiddenMenus, hiddenGroups: $hiddenGroups) {
      restaurantGuid
      hiddenMenus
      hiddenGroups
      updatedAt
    }
  }
`;

export const GET_ORDER_TRACKING = gql`
  query OrderTrackingStatus($restaurantGuid: String!) {
    orderTrackingStatus(restaurantGuid: $restaurantGuid) { restaurantGuid enabled lastRunAt lastBusinessDate }
  }
`;

export const SET_ORDER_TRACKING = gql`
  mutation SetOrderTracking($restaurantGuid: String!, $enabled: Boolean!) {
    setOrderTracking(restaurantGuid: $restaurantGuid, enabled: $enabled) { restaurantGuid enabled lastRunAt lastBusinessDate }
  }
`;

export const RUN_ORDER_TRACKING = gql`
  mutation RunOrderTracking($restaurantGuid: String!, $businessDate: String) {
    runOrderTracking(restaurantGuid: $restaurantGuid, businessDate: $businessDate)
  }
`;

// Analytics
export const GET_ANALYTICS = gql`
  query GetAnalytics($period: String!) {
    analytics(period: $period) {
      revenue
      orders
      avgOrderValue
      customerSatisfaction
      tableTurnover
      totalCustomers
      repeatCustomers
      averageWaitTime
      staffUtilization
      inventoryValue
      wastePercentage
    }
  }
`;

export const GET_REVENUE_ANALYTICS = gql`
  query GetRevenueAnalytics($startDate: Date!, $endDate: Date!) {
    revenueAnalytics(startDate: $startDate, endDate: $endDate) {
      period
      date
      revenue
      orders
      avgOrderValue
      customerSatisfaction
      tableTurnover
      totalCustomers
      repeatCustomers
      averageWaitTime
      staffUtilization
      inventoryValue
      wastePercentage
    }
  }
`;

// Inventory Analytics & Reports
export const GET_INVENTORY_MOVEMENT = gql`
  query InventoryMovement($period: String!, $startDate: Date!, $endDate: Date!, $itemId: ID) {
    inventoryMovement(period: $period, startDate: $startDate, endDate: $endDate, itemId: $itemId) {
      date
      dateKey
      received
      usage
      adjustments
      totalValue
      netMovement
      transactionCount
      itemsCount
    }
  }
`;

export const GET_INVENTORY_ANALYTICS_SUMMARY = gql`
  query InventoryAnalyticsSummary($startDate: Date!, $endDate: Date!) {
    inventoryAnalyticsSummary(startDate: $startDate, endDate: $endDate) {
      totalInventoryValue
      totalItems
      lowStockItems
      criticalItems
      wasteCostInPeriod
      wasteQtyInPeriod
      turnoverRatio
    }
  }
`;

export const GET_ABC_ANALYSIS = gql`
  query ABCAnalysis($startDate: Date!, $endDate: Date!, $metric: String) {
    abcAnalysis(startDate: $startDate, endDate: $endDate, metric: $metric) {
      itemId
      name
      value
      cumulativePct
      category
    }
  }
`;

export const GET_WASTE_REPORT = gql`
  query WasteReport($startDate: Date!, $endDate: Date!) {
    wasteReport(startDate: $startDate, endDate: $endDate) {
      byReason { reason quantity cost }
      byItem { itemId name quantity cost }
      totalQuantity
      totalCost
    }
  }
`;

export const GET_SUPPLIER_PERFORMANCE = gql`
  query SupplierPerformance($startDate: Date!, $endDate: Date!) {
    supplierPerformanceReport(startDate: $startDate, endDate: $endDate) {
      supplierId
      supplierName
      totalOrders
      totalSpent
      averageOrderValue
      onTimeDeliveryRate
      qualityRating
    }
  }
`;

export const GET_TURNOVER_SERIES = gql`
  query InventoryTurnoverSeries($period: String!, $startDate: Date!, $endDate: Date!) {
    inventoryTurnoverSeries(period: $period, startDate: $startDate, endDate: $endDate) {
      date
      period
      usageCost
      avgInventoryValue
      turnover
    }
  }
`;

export const GET_RECIPE_PROFIT = gql`
  query RecipeProfitability {
    recipeProfitabilityReport {
      recipeId
      name
      foodCost
      menuPrice
      foodCostPct
      grossMargin
      isPopular
    }
  }
`;

export const GET_CROSS_PANEL_LINKS = gql`
  query CrossPanelLinks($itemIds: [ID!]) {
    crossPanelLinks(itemIds: $itemIds) {
      itemId
      itemName
      vendorNames
      recipeNames
    }
  }
`;

// Global Search
export const GLOBAL_SEARCH = gql`
  query GlobalSearch($query: String!, $limit: Int) {
    globalSearch(query: $query, limit: $limit) {
      id
      kind
      title
      description
      route
      icon
    }
  }
`;

// Custom hooks
export const useTeamMembers = () => useQuery(GET_TEAM_MEMBERS);
export const useTeamMember = (id: string) => useQuery(GET_TEAM_MEMBER, { variables: { id } });
export const useCreateTeamMember = () => useMutation(CREATE_TEAM_MEMBER, {
  refetchQueries: [{ query: GET_TEAM_MEMBERS }]
});
export const useUpdateTeamMember = () => useMutation(UPDATE_TEAM_MEMBER, {
  refetchQueries: [{ query: GET_TEAM_MEMBERS }]
});
export const useDeleteTeamMember = () => useMutation(DELETE_TEAM_MEMBER, {
  refetchQueries: [{ query: GET_TEAM_MEMBERS }]
});

export const useInventoryItems = () => useQuery(GET_INVENTORY_ITEMS);
export const useInventoryItem = (id: string) => useQuery(GET_INVENTORY_ITEM, { variables: { id } });
export const useLowStockItems = () => useQuery(GET_LOW_STOCK_ITEMS);
export const useCreateInventoryItem = () => useMutation(CREATE_INVENTORY_ITEM, {
  refetchQueries: [{ query: GET_INVENTORY_ITEMS }]
});
export const useUpdateInventoryItem = () => useMutation(UPDATE_INVENTORY_ITEM, {
  refetchQueries: [{ query: GET_INVENTORY_ITEMS }]
});
export const useUpdateStock = () => useMutation(UPDATE_STOCK, {
  refetchQueries: [{ query: GET_INVENTORY_ITEMS }, { query: GET_LOW_STOCK_ITEMS }]
});
export const useDeleteInventoryItem = () => useMutation(DELETE_INVENTORY_ITEM, {
  refetchQueries: [{ query: GET_INVENTORY_ITEMS }]
});

export const useRecordWaste = () => useMutation(RECORD_WASTE, {
  refetchQueries: [{ query: GET_INVENTORY_ITEMS }],
});

export const useVendors = () => useQuery(GET_VENDORS);
export const useCreateVendor = () => useMutation(CREATE_VENDOR, {
  refetchQueries: [{ query: GET_VENDORS }]
});
export const useUpdateVendor = () => useMutation(UPDATE_VENDOR, {
  refetchQueries: [{ query: GET_VENDORS }]
});
export const useDeleteVendor = () => useMutation(DELETE_VENDOR, {
  refetchQueries: [{ query: GET_VENDORS }]
});

export const useUpdateVendorRepresentative = () => useMutation(UPDATE_VENDOR_REPRESENTATIVE, {
  refetchQueries: [{ query: GET_VENDORS }]
});

export const useShifts = (startDate?: string, endDate?: string) => 
  useQuery(GET_SHIFTS, { variables: { startDate, endDate } });
export const useShift = (id: string) => useQuery(GET_SHIFT, { variables: { id } });
export const useCreateShift = () => useMutation(CREATE_SHIFT, {
  refetchQueries: [{ query: GET_SHIFTS }]
});
export const useUpdateShift = () => useMutation(UPDATE_SHIFT, {
  refetchQueries: [{ query: GET_SHIFTS }]
});
export const useDeleteShift = () => useMutation(DELETE_SHIFT, {
  refetchQueries: [{ query: GET_SHIFTS }]
});

export const useInvoices = () => useQuery(GET_INVOICES);
export const useInvoice = (id: string) => useQuery(GET_INVOICE, { variables: { id } });
export const useCreateInvoice = () => useMutation(CREATE_INVOICE, {
  refetchQueries: [{ query: GET_INVOICES }]
});
export const useUpdateInvoice = () => useMutation(UPDATE_INVOICE, {
  refetchQueries: [{ query: GET_INVOICES }]
});
export const useMarkInvoicePaid = () => useMutation(MARK_INVOICE_PAID, {
  refetchQueries: [{ query: GET_INVOICES }]
});
export const useDeleteInvoice = () => useMutation(DELETE_INVOICE, {
  refetchQueries: [{ query: GET_INVOICES }]
});

export const useAnalytics = (period: string) => useQuery(GET_ANALYTICS, { variables: { period } });
export const useRevenueAnalytics = (startDate: string, endDate: string) => 
  useQuery(GET_REVENUE_ANALYTICS, { variables: { startDate, endDate } }); 

// Menu hooks
export const useIndexMenus = () => useMutation(INDEX_MENUS);
export const useIndexedMenus = (restaurantGuid: string) => useQuery(GET_INDEXED_MENUS, { variables: { restaurantGuid }, skip: !restaurantGuid });
export const useMenuVisibility = (restaurantGuid: string) => useQuery(GET_MENU_VISIBILITY, { variables: { restaurantGuid }, skip: !restaurantGuid });
export const useMenuMappings = (restaurantGuid: string, toastItemGuid?: string) => useQuery(GET_MENU_MAPPINGS, { variables: { restaurantGuid, toastItemGuid }, skip: !restaurantGuid });
export const useUpsertMenuMapping = () => useMutation(UPSERT_MENU_MAPPING);
export const useMenuItemCost = (restaurantGuid: string, toastItemGuid: string) => useQuery(GET_MENU_ITEM_COST, { variables: { restaurantGuid, toastItemGuid }, skip: !restaurantGuid || !toastItemGuid });
export const useMenuItemCapacity = (restaurantGuid: string, toastItemGuid: string, quantity?: number) =>
  useQuery(GET_MENU_ITEM_CAPACITY, { variables: { restaurantGuid, toastItemGuid, quantity }, skip: !restaurantGuid || !toastItemGuid });
export const useMenuItemStock = (restaurantGuid: string, guids?: string[], multiLocationIds?: string[]) =>
  useQuery(GET_MENU_ITEM_STOCK, { variables: { restaurantGuid, guids, multiLocationIds }, skip: !restaurantGuid || (!guids && !multiLocationIds) });
export const useUpdateMenuItemStock = () => useMutation(UPDATE_MENU_ITEM_STOCK);
export const useSetMenuVisibility = () => useMutation(SET_MENU_VISIBILITY);
export const useOrderTrackingStatus = (restaurantGuid: string) => useQuery(GET_ORDER_TRACKING, { variables: { restaurantGuid }, skip: !restaurantGuid });
export const useSetOrderTracking = () => useMutation(SET_ORDER_TRACKING);
export const useRunOrderTracking = () => useMutation(RUN_ORDER_TRACKING);

export const useInventoryMovement = (period: string, startDate: string, endDate: string, itemId?: string) =>
  useQuery(GET_INVENTORY_MOVEMENT, {
    variables: { period, startDate, endDate, itemId },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

export const useInventoryAnalyticsSummary = (startDate: string, endDate: string) =>
  useQuery(GET_INVENTORY_ANALYTICS_SUMMARY, {
    variables: { startDate, endDate },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

export const useABCAnalysis = (startDate: string, endDate: string, metric?: string) =>
  useQuery(GET_ABC_ANALYSIS, {
    variables: { startDate, endDate, metric },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

export const useWasteReport = (startDate: string, endDate: string) =>
  useQuery(GET_WASTE_REPORT, {
    variables: { startDate, endDate },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

export const useSupplierPerformance = (startDate: string, endDate: string) =>
  useQuery(GET_SUPPLIER_PERFORMANCE, {
    variables: { startDate, endDate },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

export const useTurnoverSeries = (period: string, startDate: string, endDate: string) =>
  useQuery(GET_TURNOVER_SERIES, {
    variables: { period, startDate, endDate },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

export const useRecipeProfitability = () => useQuery(GET_RECIPE_PROFIT, {
  fetchPolicy: 'network-only',
  nextFetchPolicy: 'cache-first',
  notifyOnNetworkStatusChange: true,
});

export const useCrossPanelLinks = (itemIds?: string[]) => useQuery(GET_CROSS_PANEL_LINKS, {
  variables: { itemIds },
  fetchPolicy: 'network-only',
  nextFetchPolicy: 'cache-first',
  notifyOnNetworkStatusChange: true,
});

export const useGlobalSearch = (query: string, limit: number = 10, options?: { skip?: boolean }) =>
  useQuery(GLOBAL_SEARCH, {
    variables: { query, limit },
    skip: options?.skip ?? (!query || query.length < 2),
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

// Order hooks
export const usePurchaseOrders = (vendorId?: string, status?: string) => useQuery(GET_PURCHASE_ORDERS, { variables: { vendorId, status } });
export const useCreatePurchaseOrder = () => useMutation(CREATE_PURCHASE_ORDER, { refetchQueries: [{ query: GET_PURCHASE_ORDERS }] });
export const useUpdatePurchaseOrder = () => useMutation(UPDATE_PURCHASE_ORDER, { refetchQueries: [{ query: GET_PURCHASE_ORDERS }] });
export const useReceivePurchaseOrder = () => useMutation(RECEIVE_PURCHASE_ORDER, { refetchQueries: [{ query: GET_PURCHASE_ORDERS }] });
export const useResetPurchaseOrder = () => useMutation(RESET_PURCHASE_ORDER, { refetchQueries: [{ query: GET_PURCHASE_ORDERS }] });
export const useDeletePurchaseOrder = () => useMutation(DELETE_PURCHASE_ORDER, { refetchQueries: [{ query: GET_PURCHASE_ORDERS }] });