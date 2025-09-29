import { Role, Status } from "@prisma/client"

export interface User {
  id: string;
  email: string;
  role: Role;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Image {
  id: string;
  title: string;
  description?: string;
  tags: string;
  cloudinaryId: string;
  thumbnailUrl: string;
  originalUrl: string;
  fileSize: number;
  categoryId: string;
  uploadedById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLog {
  id: string;
  action: string;
  details?: any;
  userId: string;
  imageId?: string;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface LoginResponse {
  success: boolean
  token?: string
  user?: User
  error?: string
}

export interface DashboardStats {
  totalImages: number;
  totalCategories: number;
  totalUsers: number;
  storageUsed: number;
  storageLimit: number;
}

export interface CreateImageRequest {
  title: string;
  description?: string;
  tags: string;
  categoryId: string;
  cloudinaryId: string;
  thumbnailUrl: string;
  originalUrl: string;
  fileSize: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  role?: Role;
  status?: Status;
}

export interface UserWithCounts extends User {
  _count: {
    uploadedImages: number;
    activityLogs: number;
  };
}