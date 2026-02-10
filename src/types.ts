export interface Organization {
  id: string;
  name: string;
  logo: string;
}

export interface RatingResult {
  rating_count: number;
  rating_avg: number;
}

export interface Program {
  id: number;
  type: "academic_degree" | "nanodegree";
  title: string;
  start_date: string | null;
  end_date: string | null;
  enroll_date_start: string | null;
  enroll_date_end: string | null;
  summary: string;
  price: string;
  learning_type: string;
  minimum_grade: string | null;
  collectible: string;
  status: string;
  level: string;
  sectors: string[];
  image: string;
  organization: Organization;
  courses_count: number;
  knowledge_and_skills: string | null;
  exam_price: string | null;
  pathways_count: number;
  discount: string | null;
  additional_price: string;
  academic_degree_type?: string;
  academic_degree_type_label?: string;
  version_type: string | null;
  version_type_label: string;
  evaluate_type: string | null;
  evaluate_type_label: string;
  parent_pathways_count: number;
  total_pathways_price: number;
  rating_result: RatingResult;
}

export interface MockData {
  total: number;
  nano_degrees: Program[];
}
