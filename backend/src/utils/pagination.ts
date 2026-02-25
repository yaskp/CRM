
export interface PaginationOptions {
    page?: number | string;
    limit?: number | string;
}

export const getPagination = (options: PaginationOptions) => {
    const page = parseInt(options.page as string, 10) || 1;
    const limit = parseInt(options.limit as string, 10) || 10;
    const offset = (page - 1) * limit;

    return {
        limit,
        offset,
        page
    };
};

export const getPaginationData = (count: number, page: number, limit: number) => {
    return {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
    };
};
