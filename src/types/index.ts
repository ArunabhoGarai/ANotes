export interface StudyNote {
  id: string;
  title: string;
  topic: string;
  content: string;
  createdAt: Date;
  tags: string[];
  error?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: string;
  error?: string;
}
export interface MultiTopicResult {
  topic: string;
  content: string;
  error?: string;
}