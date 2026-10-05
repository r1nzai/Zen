import { Pagination } from '@rinzai/zen';
import { useState } from 'react';

/** Pages as buttons. With a router, give `href` and render each with its Link through `renderLink`. */
export default function Default() {
    const [page, setPage] = useState(6);
    return <Pagination page={page} count={12} onPageChange={setPage} />;
}
