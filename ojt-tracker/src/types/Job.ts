interface Job{
    job_id: string,
    company_id: string,
    created_at: string,
    position: string,
    description: string,
    responsibility: string[],
    qualifications: string[],
    work_hrs: string,
    schedule: string,
    isAvailable: boolean,

}

export default Job;