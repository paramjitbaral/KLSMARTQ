export enum Role {
  STUDENT = 'STUDENT',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

export enum Priority {
  NORMAL = 'NORMAL',
  URGENT = 'URGENT',
  MEDICAL = 'MEDICAL',
}

export enum TokenStatus {
  WAITING = "WAITING",
  CALLED = "CALLED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface User {
  id: string;
  name: string;
  email: string;
  universityId?: string;
  role: Role;
  assignedOfficeIds?: string[];
}

export interface Office {
  id: string;
  name: string;
  operatingHours: string;
  tokenLimit: number;
  isActive: boolean;
  prefix: string;
}

export interface Token {
  id:string;
  tokenNumber: string;
  studentId: string;
  officeId: string;
  purpose: string;
  priority: Priority;
  status: TokenStatus;
  createdAt: Date;
  calledAt?: Date;
  completedAt?: Date;
  isCheckedIn: boolean;
  student?: {
    name: string;
    universityId?: string;
  };
}