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
    teamMembers: [TeamMember!]!
    teamMember(id: ID!): TeamMember
    
    # Scheduling queries
    shifts(startDate: Date, endDate: Date): [Shift!]!
    shift(id: ID!): Shift
    
    # Inventory queries
    inventoryItems: [InventoryItem!]!
    inventoryItem(id: ID!): InventoryItem
    lowStockItems: [InventoryItem!]!
    
    # Invoicing queries
    invoices: [Invoice!]!
    invoice(id: ID!): Invoice
    
    # Analytics queries
    analytics(period: String!): Analytics!
    revenueAnalytics(startDate: Date!, endDate: Date!): [Analytics!]!
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
    
    # Invoicing mutations
    createInvoice(input: CreateInvoiceInput!): Invoice!
    updateInvoice(id: ID!, input: UpdateInvoiceInput!): Invoice!
    deleteInvoice(id: ID!): Boolean!
    markInvoicePaid(id: ID!): Invoice!
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