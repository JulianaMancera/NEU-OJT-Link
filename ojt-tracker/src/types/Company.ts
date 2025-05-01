import { Job } from './Job';

export interface Company {
        company_id: string,
        name: string,
        address: string,
        email: string,
        contact_no: string,
        logo_url?: string,
        hasApprovedApplication?: boolean,
        applicationId?: string,
        start_time: string | null;
        end_time:   string | null;
        companyRestrict: 'Active' | 'Restricted';
        jobs: Job[],
}

export default Company;
