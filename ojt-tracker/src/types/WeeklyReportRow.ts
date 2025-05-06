export interface WeeklyReportRow{
  weekly_report_id: string;
  user_id:           string;
  start_date:        string;
  end_date:          string | null;
  week_number:       number;
  status:            string;
  file_name:         string;
  file_url:          string;
  total_hours:       number;

  user: {
    name: string;
  };
}
