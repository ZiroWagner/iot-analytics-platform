export class OAuthProfile {
    constructor(
        public readonly provider: string,
        public readonly providerAccountId: string,
        public readonly email: string | null,
        public readonly name: string | null,
        public readonly image: string | null,
        public readonly accessToken: string | null,
        public readonly refreshToken: string | null,
    ) {}

    static create(props: {
        provider: string;
        providerAccountId: string;
        email?: string | null;
        name?: string | null;
        image?: string | null;
        accessToken?: string | null;
        refreshToken?: string | null;
    }): OAuthProfile {
        return new OAuthProfile(
            props.provider,
            props.providerAccountId,
            props.email || null,
            props.name || null,
            props.image || null,
            props.accessToken || null,
            props.refreshToken || null,
        );
    }
}