import ToastAuthService from './toast-auth';
import ToastErrorHandler from './toast-error-handler';
import { z } from 'zod';

// Toast API data schemas
export const ToastEmployeeSchema = z.object({
  guid: z.string(),
  entityType: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().optional(),
  jobTitles: z.array(z.object({
    guid: z.string(),
    title: z.string(),
    tip: z.boolean(),
    hourlyRate: z.number().optional(),
  })).optional(),
  externalId: z.string().optional(),
  createdDate: z.string(),
  modifiedDate: z.string(),
  deletedDate: z.string().optional(),
});

export const ToastOrderSchema = z.object({
  guid: z.string(),
  entityType: z.string(),
  businessDate: z.number(),
  diningOption: z.object({
    guid: z.string(),
    curbside: z.boolean().optional(),
    delivery: z.boolean().optional(),
    dineIn: z.boolean().optional(),
    takeOut: z.boolean().optional(),
  }),
  checks: z.array(z.object({
    guid: z.string(),
    displayNumber: z.string(),
    openedDate: z.string(),
    closedDate: z.string().optional(),
    deletedDate: z.string().optional(),
    selections: z.array(z.any()).optional(),
    customer: z.object({
      guid: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
    }).optional(),
  })),
  createdDate: z.string(),
  modifiedDate: z.string(),
});

export const ToastMenuSchema = z.object({
  guid: z.string(),
  entityType: z.string(),
  name: z.string(),
  description: z.string().optional(),
  groups: z.array(z.object({
    guid: z.string(),
    name: z.string(),
    items: z.array(z.object({
      guid: z.string(),
      name: z.string(),
      description: z.string().optional(),
      price: z.number(),
      calories: z.number().optional(),
      visibility: z.string(),
    })),
  })),
  createdDate: z.string(),
  modifiedDate: z.string(),
});

export const ToastRestaurantSchema = z.object({
  guid: z.string(),
  entityType: z.string(),
  restaurantName: z.string(),
  locationName: z.string(),
  address: z.object({
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    stateCode: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }),
  phoneNumber: z.string().optional(),
  emailAddress: z.string().optional(),
  website: z.string().optional(),
  timeZone: z.string(),
  createdDate: z.string(),
  modifiedDate: z.string(),
});

export type ToastEmployee = z.infer<typeof ToastEmployeeSchema>;
export type ToastOrder = z.infer<typeof ToastOrderSchema>;
export type ToastMenu = z.infer<typeof ToastMenuSchema>;
export type ToastRestaurant = z.infer<typeof ToastRestaurantSchema>;

export interface ToastAPIResponse<T> {
  data: T[];
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
}

export class ToastAPIClient {
  private authService: ToastAuthService;
  private apiHostname: string;

  constructor() {
    this.authService = ToastAuthService.getInstance();
    this.apiHostname = process.env.TOAST_API_HOSTNAME!;
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    queryParams?: Record<string, string>,
    additionalHeaders?: Record<string, string>
  ): Promise<T> {
    try {
      const baseHeaders = await this.authService.getAuthHeaders();
      const headers = { ...baseHeaders, ...additionalHeaders };
      
      let url = `${this.apiHostname}${endpoint}`;
      
      // Add query parameters
      if (queryParams) {
        const searchParams = new URLSearchParams(queryParams);
        url += `?${searchParams.toString()}`;
      }

      console.log(`Making Toast API request: ${method} ${url}`);
      console.log('Headers:', { ...headers, Authorization: headers.Authorization ? `${headers.Authorization.substring(0, 20)}...` : 'None' });

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      console.log(`Toast API response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Toast API Error Response: ${errorText}`);
        throw new Error(`Toast API request failed: ${response.status} - ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return {} as T;
      }
    } catch (error) {
      const errorHandler = ToastErrorHandler.getInstance();
      const toastError = errorHandler.handleError(error, endpoint, false); // Don't show toast on server
      throw new Error(toastError.message);
    }
  }

  // Employee Management APIs
  
  /**
   * Get all employees for a restaurant
   */
  public async getEmployees(restaurantGuid: string, page = 1, pageSize = 100): Promise<ToastAPIResponse<ToastEmployee>> {
    const endpoint = `/labor/v1/employees`;
    
    // Toast API - remove employeeIds to get all employees, or pagination might not be supported
    const queryParams: Record<string, string> = {};
    
    // Only add pagination if supported
    // queryParams.page = page.toString();
    // queryParams.pageSize = pageSize.toString();

    // Employee API requires special header - exact format from Toast docs
    const headers = {
      'Toast-Restaurant-External-ID': restaurantGuid, // Note: Capital ID at the end!
    };

    console.log(`🔍 Employee API call with Toast-Restaurant-External-ID header: ${restaurantGuid}`);

    try {
      // First try with GUID as external-id
      const response = await this.makeRequest<any>(endpoint, 'GET', undefined, queryParams, headers);
        
      // Log response for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ SUCCESS with employee endpoint:`, JSON.stringify(response, null, 2));
      }
      
      // Validate and transform response
      const allEmployees = Array.isArray(response) ? response : response.data || [];
      
      // Filter for ACTIVE employees only (no deletedDate or epoch date)
      const activeEmployees = allEmployees.filter((emp: any) => {
        const deletedDate = emp.deletedDate;
        return !deletedDate || 
               deletedDate === null || 
               deletedDate === "1970-01-01T00:00:00.000+0000" ||
               deletedDate.includes("1970-01-01");
      });
      
      console.log(`📊 Total employees from Toast: ${allEmployees.length}, Active: ${activeEmployees.length}`);
      
      // Use flexible schema for employees
      const flexibleEmployeeSchema = z.object({
        guid: z.string(),
        entityType: z.string().optional(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email().optional().nullable(),
        jobTitles: z.array(z.object({
          guid: z.string(),
          title: z.string(),
          tip: z.boolean(),
          hourlyRate: z.number().optional(),
        })).optional(),
        externalId: z.string().optional().nullable(),
        createdDate: z.union([z.string(), z.number()]).optional(),
        modifiedDate: z.union([z.string(), z.number()]).optional(),
        deletedDate: z.union([z.string(), z.number()]).optional().nullable(),
        // Additional fields that might be present
        employeeId: z.string().optional(),
        status: z.string().optional(),
      }).transform((data) => {
        return {
          guid: data.guid,
          entityType: data.entityType || 'Employee',
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || undefined,
          jobTitles: data.jobTitles || [],
          externalId: data.externalId || undefined,
          createdDate: typeof data.createdDate === 'number' ? new Date(data.createdDate).toISOString() : 
                      data.createdDate || new Date().toISOString(),
          modifiedDate: typeof data.modifiedDate === 'number' ? new Date(data.modifiedDate).toISOString() : 
                       data.modifiedDate || new Date().toISOString(),
          deletedDate: data.deletedDate ? 
                      (typeof data.deletedDate === 'number' ? new Date(data.deletedDate).toISOString() : data.deletedDate) : 
                      undefined,
        };
      });
      
      const validatedEmployees = activeEmployees.map((emp: any) => flexibleEmployeeSchema.parse(emp));

      console.log(`Found ${validatedEmployees.length} employees from Toast API`);

      return {
        data: validatedEmployees,
        page,
        pageSize,
        hasMore: validatedEmployees.length === pageSize,
      };
      
    } catch (error: any) {
      // If it fails with restaurant-external-id error, try other approaches
      if (error.message && error.message.includes('restaurant-external-id')) {
        console.log(`❌ Failed with restaurant-external-id header. Trying alternate approaches...`);
        
        // Try with different approaches based on Toast docs
        const alternativeHeaders = [
          { 'Toast-Restaurant-External-ID': restaurantGuid }, // Exact format
          { 'restaurant-external-id': restaurantGuid },
          {}, // Try without the header
        ];
        
        for (const altHeaders of alternativeHeaders) {
          try {
            console.log(`🔄 Trying alternative headers:`, altHeaders);
            const response = await this.makeRequest<any>(endpoint, 'GET', undefined, queryParams, altHeaders);
            
            // If successful, process the response the same way
            const allEmployees = Array.isArray(response) ? response : response.data || [];
            const activeEmployees = allEmployees.filter((emp: any) => {
              const deletedDate = emp.deletedDate;
              return !deletedDate || 
                     deletedDate === null || 
                     deletedDate === "1970-01-01T00:00:00.000+0000" ||
                     deletedDate.includes("1970-01-01");
            });
            const validatedEmployees = activeEmployees.map((emp: any) => flexibleEmployeeSchema.parse(emp));
            
            console.log(`✅ Found ${validatedEmployees.length} employees with alternative header approach`);
            
            return {
              data: validatedEmployees,
              page,
              pageSize,
              hasMore: validatedEmployees.length === pageSize,
            };
          } catch (altError) {
            console.log(`❌ Alternative approach failed:`, altError instanceof Error ? altError.message : altError);
            continue;
          }
        }
      }
      
      const errorHandler = ToastErrorHandler.getInstance();
      const toastError = errorHandler.handleError(error, endpoint, false); // Don't show toast on server
      throw new Error(toastError.message);
    }
  }

  /**
   * Get a specific employee by GUID
   */
  public async getEmployee(restaurantGuid: string, employeeGuid: string): Promise<ToastEmployee> {
    const endpoint = `/labor/v1/employees/${employeeGuid}`;
    const queryParams = { restaurantGuid };

    const response = await this.makeRequest<any>(endpoint, 'GET', undefined, queryParams);
    return ToastEmployeeSchema.parse(response);
  }

  /**
   * Create a new employee
   */
  public async createEmployee(restaurantGuid: string, employeeData: Partial<ToastEmployee>): Promise<ToastEmployee> {
    const endpoint = `/labor/v1/employees`;
    const queryParams = { restaurantGuid };

    const response = await this.makeRequest<any>(endpoint, 'POST', employeeData, queryParams);
    return ToastEmployeeSchema.parse(response);
  }

  /**
   * Update an existing employee
   */
  public async updateEmployee(restaurantGuid: string, employeeGuid: string, employeeData: Partial<ToastEmployee>): Promise<ToastEmployee> {
    const endpoint = `/labor/v1/employees/${employeeGuid}`;
    const queryParams = { restaurantGuid };

    const response = await this.makeRequest<any>(endpoint, 'PUT', employeeData, queryParams);
    return ToastEmployeeSchema.parse(response);
  }

  // Order Management APIs

  /**
   * Get orders for a specific date range
   */
  public async getOrders(
    restaurantGuid: string,
    startDate: string,
    endDate: string,
    page = 1,
    pageSize = 100
  ): Promise<ToastAPIResponse<ToastOrder>> {
    const endpoint = `/orders/v2/orders`;
    const queryParams = {
      restaurantGuid,
      startDate,
      endDate,
      page: page.toString(),
      pageSize: pageSize.toString(),
    };

    // Add required header for Toast API
    const headers = {
      'Toast-Restaurant-External-ID': restaurantGuid,
    };

    const response = await this.makeRequest<any>(endpoint, 'GET', undefined, queryParams, headers);
    
    const orders = Array.isArray(response) ? response : response.data || [];
    const validatedOrders = orders.map((order: any) => ToastOrderSchema.parse(order));

    return {
      data: validatedOrders,
      page,
      pageSize,
      hasMore: validatedOrders.length === pageSize,
    };
  }

  /**
   * Get a specific order by GUID
   */
  public async getOrder(restaurantGuid: string, orderGuid: string): Promise<ToastOrder> {
    const endpoint = `/orders/v2/orders/${orderGuid}`;
    const queryParams = { restaurantGuid };

    const response = await this.makeRequest<any>(endpoint, 'GET', undefined, queryParams);
    return ToastOrderSchema.parse(response);
  }

  // Menu Management APIs

  /**
   * Get menu information
   */
  public async getMenus(restaurantGuid: string): Promise<ToastAPIResponse<ToastMenu>> {
    const endpoint = `/menus/v2/menus`;
    const queryParams = { restaurantGuid };

    const response = await this.makeRequest<any>(endpoint, 'GET', undefined, queryParams);
    
    const menus = Array.isArray(response) ? response : response.data || [];
    const validatedMenus = menus.map((menu: any) => ToastMenuSchema.parse(menu));

    return {
      data: validatedMenus,
    };
  }

  // Restaurant Information APIs

  /**
   * Get restaurant information
   */
  public async getRestaurant(restaurantGuid: string): Promise<ToastRestaurant> {
    const endpoint = `/restaurants/v1/restaurants/${restaurantGuid}`;

    const response = await this.makeRequest<any>(endpoint, 'GET');
    
    // Log response for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Toast Restaurant Response:', JSON.stringify(response, null, 2));
    }
    
    // Use flexible validation
    const flexibleRestaurantSchema = z.object({
      guid: z.string().optional(),
      restaurantGuid: z.string().optional(),
      id: z.string().optional(),
      entityType: z.string().optional(),
      restaurantName: z.string().optional(),
      locationName: z.string().optional(),
      name: z.string().optional(),
      address: z.object({
        address1: z.string().optional(),
        address2: z.string().optional(),
        city: z.string().optional(),
        stateCode: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
      }).optional(),
      phoneNumber: z.string().optional(),
      emailAddress: z.string().optional(),
      website: z.string().optional(),
      timeZone: z.string().optional(),
      createdDate: z.union([z.string(), z.number()]).optional(),
      modifiedDate: z.union([z.string(), z.number()]).optional(),
      isoCreatedDate: z.string().optional(),
      isoModifiedDate: z.string().optional(),
    }).transform((data) => {
      return {
        guid: data.guid || data.restaurantGuid || data.id || restaurantGuid,
        entityType: data.entityType || 'Restaurant',
        restaurantName: data.restaurantName || data.name || 'Unknown Restaurant',
        locationName: data.locationName || data.name || 'Unknown Location',
        address: data.address || {
          address1: '',
          city: '',
          stateCode: '',
          zipCode: '',
          country: 'US',
        },
        phoneNumber: data.phoneNumber || '',
        emailAddress: data.emailAddress || '',
        website: data.website || '',
        timeZone: data.timeZone || 'America/New_York',
        createdDate: data.isoCreatedDate || 
                    (typeof data.createdDate === 'number' ? new Date(data.createdDate).toISOString() : 
                     data.createdDate) || new Date().toISOString(),
        modifiedDate: data.isoModifiedDate || 
                     (typeof data.modifiedDate === 'number' ? new Date(data.modifiedDate).toISOString() : 
                      data.modifiedDate) || new Date().toISOString(),
      };
    });
    
    return flexibleRestaurantSchema.parse(response);
  }

  /**
   * Get all connected restaurants
   */
  public async getConnectedRestaurants(): Promise<ToastAPIResponse<ToastRestaurant>> {
    const endpoint = `/partners/v1/restaurants`;

    const response = await this.makeRequest<any>(endpoint, 'GET');
    
    // Log response for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Toast Restaurants Response:', JSON.stringify(response, null, 2));
    }
    
    const restaurants = Array.isArray(response) ? response : response.data || [];
    
    // Use a more flexible schema for restaurant validation
    const flexibleRestaurantSchema = z.object({
      guid: z.string().optional(),
      restaurantGuid: z.string().optional(),
      id: z.string().optional(),
      entityType: z.string().optional(),
      restaurantName: z.string().optional(),
      locationName: z.string().optional(),
      name: z.string().optional(),
      address: z.object({
        address1: z.string().optional(),
        address2: z.string().optional(),
        city: z.string().optional(),
        stateCode: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
      }).optional(),
      phoneNumber: z.string().optional(),
      emailAddress: z.string().optional(),
      website: z.string().optional(),
      timeZone: z.string().optional(),
      createdDate: z.union([z.string(), z.number()]).optional(),
      modifiedDate: z.union([z.string(), z.number()]).optional(),
      // Additional fields that might be present
      managementGroupGuid: z.string().optional(),
      isArchived: z.boolean().optional(),
      deleted: z.boolean().optional(),
      createdByEmailAddress: z.string().optional(),
      externalGroupRef: z.string().optional().nullable(),
      externalRestaurantRef: z.string().optional().nullable(),
      isoCreatedDate: z.string().optional(),
      isoModifiedDate: z.string().optional(),
    }).transform((data) => {
      // Normalize restaurant data
      return {
        guid: data.guid || data.restaurantGuid || data.id || 'unknown',
        entityType: data.entityType || 'Restaurant',
        restaurantName: data.restaurantName || data.name || 'Unknown Restaurant',
        locationName: data.locationName || data.name || 'Unknown Location',
        address: data.address || {
          address1: '',
          city: '',
          stateCode: '',
          zipCode: '',
          country: 'US',
        },
        phoneNumber: data.phoneNumber || '',
        emailAddress: data.emailAddress || '',
        website: data.website || '',
        timeZone: data.timeZone || 'America/New_York',
        createdDate: data.isoCreatedDate || 
                    (typeof data.createdDate === 'number' ? new Date(data.createdDate).toISOString() : 
                     data.createdDate) || new Date().toISOString(),
        modifiedDate: data.isoModifiedDate || 
                     (typeof data.modifiedDate === 'number' ? new Date(data.modifiedDate).toISOString() : 
                      data.modifiedDate) || new Date().toISOString(),
      };
    });
    
    const validatedRestaurants = restaurants.map((restaurant: any) => flexibleRestaurantSchema.parse(restaurant));

    return {
      data: validatedRestaurants,
    };
  }

  // Analytics APIs

  /**
   * Get sales summary for a date range
   */
  public async getSalesSummary(
    restaurantGuid: string,
    businessDate: string
  ): Promise<any> {
    const endpoint = `/reports/v1/reports/salesSummary`;
    const queryParams = {
      restaurantGuid,
      businessDate,
    };

    return await this.makeRequest<any>(endpoint, 'GET', undefined, queryParams);
  }

  /**
   * Get labor summary for a date range
   */
  public async getLaborSummary(
    restaurantGuid: string,
    businessDate: string
  ): Promise<any> {
    const endpoint = `/reports/v1/reports/laborSummary`;
    const queryParams = {
      restaurantGuid,
      businessDate,
    };

    return await this.makeRequest<any>(endpoint, 'GET', undefined, queryParams);
  }

  // Utility Methods

  /**
   * Test API connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.getConnectedRestaurants();
      return true;
    } catch (error) {
      console.error('Toast API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get API health status
   */
  public async getHealthStatus(): Promise<{ status: string; timestamp: string }> {
    try {
      const restaurants = await this.getConnectedRestaurants();
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export default ToastAPIClient;