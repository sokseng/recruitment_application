import useAuthStore from '../../store/useAuthStore'
import UpdateProfileCandidate from './UpdateProfileCandidate'

export default function UpdateProfile() {
  const { user_type } = useAuthStore()

//   if (user_type === 1) return <UpdateProfileAdmin />
//   if (user_type === 2) return <UpdateProfileEmployer />
  if (user_type === 3) return <UpdateProfileCandidate />

  return null
}
