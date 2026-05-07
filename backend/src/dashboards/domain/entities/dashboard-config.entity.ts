export interface DashboardConfigProps {
  id: string;
  projectId: string;
  layoutConfig: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class DashboardConfig {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public layoutConfig: Record<string, unknown>,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: {
    id: string;
    projectId: string;
    layoutConfig: Record<string, unknown>;
  }): DashboardConfig {
    return new DashboardConfig(
      props.id,
      props.projectId,
      props.layoutConfig,
      new Date(),
      new Date(),
    );
  }

  static createFromPersistence(props: DashboardConfigProps): DashboardConfig {
    return new DashboardConfig(
      props.id,
      props.projectId,
      props.layoutConfig,
      props.createdAt,
      props.updatedAt,
    );
  }

  updateLayout(layoutConfig: Record<string, unknown>): void {
    this.layoutConfig = layoutConfig;
  }
}