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
        jobs?: Job[],
}

export default Company;