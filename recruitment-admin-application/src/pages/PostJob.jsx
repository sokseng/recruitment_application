// src/pages/PostJob.jsx
import { Container } from '@mui/material';
import JobPostForm from '../components/JobPostForm';
import ProtectedRoute from '../components/ProtectedRoute';

export default function PostJob() {
  return (
    <ProtectedRoute>
      <Container maxWidth="md">
        <JobPostForm />
      </Container>
    </ProtectedRoute>
  );
}