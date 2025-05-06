export interface MonthlyReportRow {
  monthly_report_id: string;
  user_id:           string;
  month:             number | null;
  year:              number | null;
  status:            string;
  hours_rendered:    number | null;
  file_name:         string;
  file_url:          string;

  // JOIN
  user: {
    name: string;
  };
}
