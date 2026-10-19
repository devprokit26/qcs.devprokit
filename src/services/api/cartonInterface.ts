import { CartonType, CartonMovement, CartonUsedLine, NewCartonType } from '@/models/types';

/** Interface for carton service — both mock and REST variants must match */
export interface ICartonService {
  getCartonTypes(): Promise<CartonType[]>;
  saveCartonType(ct: NewCartonType): Promise<CartonType>;
  updateCartonType(id: number, patch: Partial<Omit<CartonType, 'id'>>): Promise<CartonType>;
  deleteCartonType(id: number): Promise<void>;
  getCartonMovements(): Promise<CartonMovement[]>;
  addCartonMovement(m: Omit<CartonMovement, 'id' | 'createdAt'>): Promise<CartonMovement>;
  applyCartonsUsed(lines: CartonUsedLine[], shipmentId: number, date: string, createdBy: string): Promise<void>;
  resetCartonData(): Promise<void>;
}
