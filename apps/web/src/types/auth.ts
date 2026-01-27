export enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  CASHIER = 'CASHIER',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  company: {
    id: string;
    name: string;
  };
  parkingLot: {
    id: string;
    name: string;
  } | null;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
