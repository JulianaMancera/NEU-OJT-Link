export interface WeeklyJournalRow {
  weekly_journal_id: string;
  user_id:           string;
  start_date:        string;
  uploaded_at:       string;
  status:            string;
  file_name:         string;
  file_url:          string;

  //JOIN 
  user: {
    name: string;
  };
}
