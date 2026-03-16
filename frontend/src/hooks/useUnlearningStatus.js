import { useState, useEffect } from 'react';
import { getUnlearnStatus } from '../services/api';

const useUnlearningStatus = (jobId) => {
    const [status, setStatus] = useState(null);
    const [metrics, setMetrics] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!jobId) return;

        let interval;
        const fetchStatus = async () => {
            try {
                const data = await getUnlearnStatus(jobId);
                setStatus(data.status);
                setMetrics(data.metrics || []);
                if (data.status === 'completed' || data.status === 'failed') {
                    clearInterval(interval);
                    if (data.status === 'failed') setError(data.error_message || "Unknown error");
                }
            } catch (err) {
                console.error("Error fetching unlearning status:", err);
                setError(err.message);
                clearInterval(interval);
            }
        };

        // Fetch immediately then poll
        fetchStatus();
        interval = setInterval(fetchStatus, 2000);

        return () => clearInterval(interval);
    }, [jobId]);

    return { status, metrics, error };
};

export default useUnlearningStatus;
