import { Card, CardContent, Typography, CardMedia, Link } from '@mui/material';
import { useEffect, useState } from 'react';

function LinkPreview({ url }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        async function fetchPreview() {
            try {
                // Use a backend API or public service to fetch website preview
                // Example: OpenGraph.io, LinkPreview API, or your own server
                const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error(err);
            }
        }

        fetchPreview();
    }, [url]);

    if (!data) return null;

    return (
        <Card sx={{ mt: 1, maxWidth: 300 }}>
            {data.image && <CardMedia component="img" height="140" image={data.image} alt={data.title} />}
            <CardContent>
                <Typography variant="subtitle2">{data.title}</Typography>
                <Typography variant="body2" color="text.secondary">{data.description}</Typography>
                <Link href={url} target="_blank" rel="noopener noreferrer">
                    {url}
                </Link>
            </CardContent>
        </Card>
    );
}

export default LinkPreview;