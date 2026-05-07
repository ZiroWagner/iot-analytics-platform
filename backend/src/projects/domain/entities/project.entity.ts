export class Project {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string | null,
    public readonly userId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    // Optional properties for aggregates or queries
    public readonly _deviceCount?: number,
    public readonly devices?: any[],
  ) {}

  public update(name?: string, description?: string | null): void {
    if (name) {
      if (name.length < 3) throw new Error("Project name must be at least 3 characters");
      this.name = name;
    }
    if (description !== undefined) {
      this.description = description;
    }
  }

  // Factory method to create a valid instance
  static create(props: {
    id: string;
    name: string;
    description: string | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    deviceCount?: number;
    devices?: any[];
  }): Project {
    if (!props.name || props.name.trim().length < 3) {
      throw new Error("Project name must be at least 3 characters");
    }
    return new Project(
      props.id,
      props.name,
      props.description,
      props.userId,
      props.createdAt,
      props.updatedAt,
      props.deviceCount,
      props.devices
    );
  }
}
