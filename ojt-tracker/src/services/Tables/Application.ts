export default interface Application {
  application_id: string;
  user_id: string;
  company_id: string;
  email: string;
  status: 'approved' | 'pending' | 'rejected';
}