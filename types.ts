export enum Role {
  STUDENT = 'STUDENT',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

export enum Priority {
  NORMAL = 'Normal',
  URGENT = 'Urgent',
  MEDICAL = 'Medical',
}

export enum TokenStatus {
  WAITING = "Waiting",
  CALLED = "Called",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
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