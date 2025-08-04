import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { gql } from '@apollo/client';

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