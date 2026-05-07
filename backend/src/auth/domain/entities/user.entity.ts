export class User {
    constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly name: string | null,
        public readonly password: string | null,
        public readonly image: string | null,
    ) {}

    static create(props: {
        id: string;
        email: string | null;
        name?: string | null;
        password?: string | null;
        image?: string | null;
    }): User {
        return new User(
            props.id,
            props.email ?? '',
            props.name ?? null,
            props.password ?? null,
            props.image ?? null,
        );
    }

    hasPassword(): boolean {
        return this.password !== null;
    }

    toJwtPayload(): { sub: string; email: string; name?: string; image?: string } {
        return {
            sub: this.id,
            email: this.email,
            name: this.name ?? undefined,
            image: this.image ?? undefined,
        };
    }
}