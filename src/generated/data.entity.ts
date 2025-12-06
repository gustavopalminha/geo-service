import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('data')
export class Data {
  @PrimaryColumn()
  pkuid: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  geometry: Buffer;

}
