import { gql } from '@apollo/client';

// GraphQL Type Definitions for Varuni Backoffice
export const typeDefs = gql`
  scalar Date

  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    avatar: String
    createdAt: Date!
    updatedAt: Date!
  }

  type TeamMember {
    id: ID!
    name: String!
    email: String!
    phone: String
    role: String!
    department: String!
    status: String!
    joinDate: Date!
    hourlyRate: Float!
    availability: String!
    skills: [String!]!
    performance: Performance!
    toastId: String
  }

  type Performance {
    rating: Float!
    completedShifts: Int!
    onTimeRate: Float!
    customerRating: Float!
    salesGenerated: Float!
    history: [PerformanceHistory!]!
  }

  type PerformanceHistory {
    date: Date!
    rating: Float!
  }

  type Shift {
    id: ID!
    date: Date!
    startTime: String!
    endTime: String!
    role: String!
    assignedTo: String!
    status: String!
    notes: String
    actualStartTime: String
    actualEndTime: String
    breakTime: Int
    teamMember: TeamMember
  }

  # Roster types
  enum RosterStratum {
    ADMIN
    BOH
    FOH
  }

  type RosterAssignment {
    userId: ID!
    source: String!
    displayName: String
    rating: Float
  }

  type RosterNode {
    id: ID!
    name: String!
    department: String!
    stratum: RosterStratum!
    capacity: Int!
    assigned: [RosterAssignment!]!
    children: [RosterNode!]
  }

  type RosterConfiguration {
    id: ID!
    name: String!
    description: String
    isActive: Boolean!
    nodes: [RosterNode!]!
    createdAt: Date!
    updatedAt: Date!
  }

  type RosterCandidate {
    id: ID!
    name: String!
    email: String
    role: String
    roles: [String!]!
    department: String
    toastEnrolled: Boolean!
    sevenShiftsEnrolled: Boolean!
    rating: Float
  }

  type InventoryItem {
    id: ID!
    name: String!
    category: String!
    currentStock: Float!
    minThreshold: Float!
    maxCapacity: Float!
    unit: String!
    costPerUnit: Float!
    supplier: String!
    lastUpdated: Date!
    status: String!
    location: String
    barcode: String
    qrCode: String
    description: String
    expiryDate: Date
    waste: Float
    reorderPoint: Float
    reorderQuantity: Float
    syscoSKU: String
    vendorSKU: String
    casePackSize: String
    vendorCode: String
    syscoCategory: String
    leadTimeDays: Int
    minimumOrderQty: Int
    pricePerCase: Float
    lastOrderDate: Date
    preferredVendor: String
    alternateVendors: [String]
    averageDailyUsage: Float
    seasonalItem: Boolean
    notes: String
    brand: String
    wasteLogs: [WasteLog!]
    restockPeriod: String
    restockDays: Int
  }

  type WasteLog {
    id: ID!
    date: Date!
    quantity: Float!
    reason: String!
    notes: String
    recordedBy: User
  }

  type Invoice {
    id: ID!
    invoiceNumber: String!
    clientName: String!
    clientEmail: String
    clientPhone: String
    amount: Float!
    tax: Float
    totalAmount: Float!
    dueDate: Date!
    status: String!
    issuedDate: Date!
    paidDate: Date
    description: String!
    paymentMethod: String!
    notes: String
    terms: String
  }

  type Analytics {
    revenue: Float!
    orders: Int!
    avgOrderValue: Float!
    customerSatisfaction: Float!
    tableTurnover: Float!
    totalCustomers: Int!
    repeatCustomers: Int!
    averageWaitTime: Float!
    staffUtilization: Float!
    inventoryValue: Float!
    wastePercentage: Float!
    period: String
    date: Date
  }

  type Query {
    # User queries
    me: User
    users: [User!]!
    
    # Team queries
    teamMembers(timeWindow: String): [TeamMember!]!
    teamMember(id: ID!): TeamMember
    
    # Scheduling queries
    shifts(startDate: Date, endDate: Date): [Shift!]!
    shift(id: ID!): Shift
    
    # Inventory queries
    inventoryItems: [InventoryItem!]!
    inventoryItem(id: ID!): InventoryItem
    lowStockItems: [InventoryItem!]!

    # Vendor queries
    vendors: [Vendor!]!
    vendor(id: ID!): Vendor
    
    # Invoicing queries
    invoices: [Invoice!]!
    invoice(id: ID!): Invoice
    
    # Analytics queries
    analytics(period: String!): Analytics!
    revenueAnalytics(startDate: Date!, endDate: Date!): [Analytics!]!

    # Roster queries
    rosterConfigurations: [RosterConfiguration!]!
    rosterConfiguration(name: String!): RosterConfiguration
    activeRosterConfiguration: RosterConfiguration
    rosterCandidates(includeToastOnly: Boolean, onlySevenShiftsActive: Boolean): [RosterCandidate!]!
  }

  type Mutation {
    # User mutations
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    
    # Team mutations
    createTeamMember(input: CreateTeamMemberInput!): TeamMember!
    updateTeamMember(id: ID!, input: UpdateTeamMemberInput!): TeamMember!
    deleteTeamMember(id: ID!): Boolean!
    syncFromToast: Boolean!
    
    # Scheduling mutations
    createShift(input: CreateShiftInput!): Shift!
    updateShift(id: ID!, input: UpdateShiftInput!): Shift!
    deleteShift(id: ID!): Boolean!
    
    # Inventory mutations
    createInventoryItem(input: CreateInventoryItemInput!): InventoryItem!
    updateInventoryItem(id: ID!, input: UpdateInventoryItemInput!): InventoryItem!
    deleteInventoryItem(id: ID!): Boolean!
    updateStock(id: ID!, quantity: Float!): InventoryItem!
    recordWaste(itemId: ID!, quantity: Float!, reason: String!, notes: String): InventoryItem!

    # Vendor mutations
    createVendor(input: CreateVendorInput!): Vendor!
    updateVendor(id: ID!, input: UpdateVendorInput!): Vendor!
    deleteVendor(id: ID!): Boolean!
    
    # Invoicing mutations
    createInvoice(input: CreateInvoiceInput!): Invoice!
    updateInvoice(id: ID!, input: UpdateInvoiceInput!): Invoice!
    deleteInvoice(id: ID!): Boolean!
    markInvoicePaid(id: ID!): Invoice!

    # Roster mutations
    createRosterConfiguration(input: CreateRosterInput!): RosterConfiguration!
    updateRosterConfiguration(id: ID!, input: UpdateRosterInput!): RosterConfiguration!
    deleteRosterConfiguration(id: ID!): Boolean!
    setActiveRosterConfiguration(id: ID!): RosterConfiguration!
  }

  # Input types
  input CreateUserInput {
    name: String!
    email: String!
    role: String!
    password: String!
  }

  input UpdateUserInput {
    name: String
    email: String
    role: String
  }

  input CreateTeamMemberInput {
    name: String!
    email: String!
    phone: String
    role: String!
    department: String!
    hourlyRate: Float!
    availability: String!
    skills: [String!]!
  }

  input UpdateTeamMemberInput {
    name: String
    email: String
    phone: String
    role: String
    department: String
    hourlyRate: Float
    availability: String
    skills: [String!]
    status: String
  }

  input CreateShiftInput {
    date: Date!
    startTime: String!
    endTime: String!
    role: String!
    assignedTo: String!
    notes: String
  }

  input UpdateShiftInput {
    date: Date
    startTime: String
    endTime: String
    role: String
    assignedTo: String
    status: String
    notes: String
    actualStartTime: String
    actualEndTime: String
    breakTime: Int
  }

  input CreateInventoryItemInput {
    name: String!
    category: String!
    currentStock: Float!
    minThreshold: Float!
    maxCapacity: Float!
    unit: String!
    costPerUnit: Float!
    supplier: String!
    location: String
    barcode: String
    qrCode: String
    description: String
    expiryDate: Date
    reorderPoint: Float
    reorderQuantity: Float
    averageDailyUsage: Float
    restockPeriod: String
    restockDays: Int
  }

  input UpdateInventoryItemInput {
    name: String
    category: String
    currentStock: Float
    minThreshold: Float
    maxCapacity: Float
    unit: String
    costPerUnit: Float
    supplier: String
    location: String
    barcode: String
    qrCode: String
    description: String
    expiryDate: Date
    waste: Float
    reorderPoint: Float
    reorderQuantity: Float
    averageDailyUsage: Float
    restockPeriod: String
    restockDays: Int
  }

  input CreateInvoiceInput {
    invoiceNumber: String
    clientName: String!
    clientEmail: String
    clientPhone: String
    amount: Float!
    tax: Float
    dueDate: Date!
    description: String!
    paymentMethod: String!
    notes: String
    terms: String
  }

  input UpdateInvoiceInput {
    invoiceNumber: String
    clientName: String
    clientEmail: String
    clientPhone: String
    amount: Float
    tax: Float
    dueDate: Date
    description: String
    paymentMethod: String
    status: String
    notes: String
    terms: String
  }

  # Vendor types
  type VendorContact {
    name: String
    title: String
    email: String
    phone: String
    mobile: String
    isPrimary: Boolean
  }

  type VendorRepresentative {
    name: String
    title: String
    email: String
    phone: String
    mobile: String
    startDate: Date
    notes: String
  }

  type VendorRepresentativeHistoryItem {
    representative: VendorRepresentative
    fromDate: Date
    toDate: Date
    reason: String
    changedBy: String
    changedAt: Date
  }

  type VendorAddress {
    street: String
    city: String
    state: String
    zipCode: String
    country: String
  }

  type VendorPaymentTerms {
    terms: String
    customTerms: String
    creditLimit: Float
    currentBalance: Float
    currency: String
  }

  type VendorDeliveryInfo {
    deliveryDays: [String]
    deliveryWindow: String
    minimumOrder: Float
    deliveryFee: Float
    freeDeliveryThreshold: Float
    leadTimeDays: Int
  }

  type VendorPerformanceMetrics {
    totalOrders: Int
    totalSpent: Float
    averageOrderValue: Float
    onTimeDeliveryRate: Float
    qualityRating: Float
    responseTime: Float
    lastOrderDate: Date
    lastDeliveryDate: Date
  }

  type VendorDocument {
    name: String
    type: String
    url: String
    uploadDate: Date
    expiryDate: Date
  }

  type Vendor {
    id: ID!
    name: String!
    companyName: String!
    supplierCode: String
    type: String
    categories: [String]
    status: String
    contacts: [VendorContact]
    address: VendorAddress
    paymentTerms: VendorPaymentTerms
    deliveryInfo: VendorDeliveryInfo
    performanceMetrics: VendorPerformanceMetrics
    certifications: [String]
    documents: [VendorDocument]
    currentRepresentative: VendorRepresentative
    representativeHistory: [VendorRepresentativeHistoryItem]
    notes: String
    isPreferred: Boolean
  }

  input CreateVendorInput {
    name: String!
    companyName: String!
    supplierCode: String
    type: String
    categories: [String!]
    status: String
    notes: String
    isPreferred: Boolean
    address: VendorAddressInput
    paymentTerms: VendorPaymentTermsInput
    deliveryInfo: VendorDeliveryInfoInput
    contacts: [VendorContactInput!]
    certifications: [String!]
  }

  input UpdateVendorInput {
    name: String
    companyName: String
    supplierCode: String
    type: String
    categories: [String!]
    status: String
    notes: String
    isPreferred: Boolean
    address: VendorAddressInput
    paymentTerms: VendorPaymentTermsInput
    deliveryInfo: VendorDeliveryInfoInput
    contacts: [VendorContactInput!]
    certifications: [String!]
  }

  input VendorContactInput {
    name: String
    title: String
    email: String
    phone: String
    mobile: String
    isPrimary: Boolean
  }

  input VendorAddressInput {
    street: String
    city: String
    state: String
    zipCode: String
    country: String
  }

  input VendorPaymentTermsInput {
    terms: String
    customTerms: String
    creditLimit: Float
    currentBalance: Float
    currency: String
  }

  input VendorDeliveryInfoInput {
    deliveryDays: [String!]
    deliveryWindow: String
    minimumOrder: Float
    deliveryFee: Float
    freeDeliveryThreshold: Float
    leadTimeDays: Int
  }

  input VendorRepresentativeInput {
    name: String!
    title: String
    email: String
    phone: String
    mobile: String
    startDate: Date
    notes: String
  }

  input UpdateVendorRepresentativeInput {
    representative: VendorRepresentativeInput!
    reason: String
  }

  extend type Mutation {
    updateVendorRepresentative(id: ID!, input: UpdateVendorRepresentativeInput!): Vendor!
  }

  # Roster inputs
  input RosterAssignmentInput {
    userId: ID!
    source: String!
    displayName: String
    rating: Float
  }

  input RosterNodeInput {
    id: ID!
    name: String!
    department: String!
    stratum: RosterStratum!
    capacity: Int!
    assigned: [RosterAssignmentInput!]
    children: [RosterNodeInput!]
  }

  input CreateRosterInput {
    name: String!
    description: String
    nodes: [RosterNodeInput!]!
  }

  input UpdateRosterInput {
    name: String
    description: String
    nodes: [RosterNodeInput!]
    isActive: Boolean
  }

  # Saved Roster types
  type AggregateRating {
    department: String!
    rating: Float!
  }

  type SavedRoster {
    id: ID!
    name: String!
    rosterDate: Date!
    shift: String!
    notes: String
    nodes: [RosterNode!]!
    aggregateRatings: AggregateRatings!
    createdAt: Date!
    updatedAt: Date!
  }

  type AggregateRatings {
    overall: Float!
    byDepartment: [AggregateRating!]!
  }

  # Saved Roster queries and mutations
  extend type Query {
    savedRosters(startDate: Date!, endDate: Date!): [SavedRoster!]!
    savedRoster(id: ID!): SavedRoster
  }

  extend type Mutation {
    saveRoster(input: SaveRosterInput!): SavedRoster!
    updateSavedRoster(id: ID!, input: SaveRosterInput!): SavedRoster!
    deleteSavedRoster(id: ID!): Boolean!
  }

  input SaveRosterInput {
    name: String!
    rosterDate: Date!
    shift: String!
    notes: String
    nodes: [RosterNodeInput!]!
    aggregateRatings: AggregateRatingsInput!
  }
  
  input AggregateRatingsInput {
      overall: Float!
      byDepartment: [AggregateRatingInput!]!
  }

  input AggregateRatingInput {
      department: String!
      rating: Float!
  }

  # Role Mapping types
  type RoleMapping {
    id: ID!
    sevenShiftsRoleName: String!
    standardRoleName: String!
    department: String!
    stratum: RosterStratum!
  }

  extend type Query {
    roleMappings: [RoleMapping!]!
  }

  extend type Mutation {
    updateRoleMapping(id: ID!, input: RoleMappingInput!): RoleMapping!
  }

  input RoleMappingInput {
    standardRoleName: String!
    department: String!
    stratum: RosterStratum!
  }

  # Subscriptions for real-time updates
  type Subscription {
    shiftUpdated: Shift!
    inventoryUpdated: InventoryItem!
    newInvoice: Invoice!
    teamMemberUpdated: TeamMember!
  }
`;

// GraphQL Queries
export const GET_TEAM_MEMBERS = gql`
  query GetTeamMembers {
    teamMembers {
      id
      name
      email
      role
      department
      status
      performance {
        rating
        completedShifts
        onTimeRate
        salesGenerated
      }
    }
  }
`;

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

export const GET_INVENTORY_ITEMS = gql`
  query GetInventoryItems {
    inventoryItems {
      id
      name
      category
      currentStock
      minThreshold
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
      restockPeriod
      restockDays
    }
  }
`;

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

// GraphQL Mutations
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

export const CREATE_SHIFT = gql`
  mutation CreateShift($input: CreateShiftInput!) {
    createShift(input: $input) {
      id
      date
      startTime
      endTime
      role
      assignedTo
    }
  }
`;

export const UPDATE_INVENTORY_STOCK = gql`
  mutation UpdateStock($id: ID!, $quantity: Float!) {
    updateStock(id: $id, quantity: $quantity) {
      id
      currentStock
      status
    }
  }
`;

export const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      id
      clientName
      amount
      dueDate
      status
    }
  }
`;

export const SYNC_FROM_TOAST = gql`
  mutation SyncFromToast {
    syncFromToast
  }
`;

// GraphQL Subscriptions
export const SHIFT_UPDATED = gql`
  subscription ShiftUpdated {
    shiftUpdated {
      id
      date
      startTime
      endTime
      assignedTo
      status
    }
  }
`;

export const INVENTORY_UPDATED = gql`
  subscription InventoryUpdated {
    inventoryUpdated {
      id
      name
      currentStock
      status
    }
  }
`;

export default typeDefs; 