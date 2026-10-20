
const BASE_URL =
  "https://6ad7a77195e98f36aef2b72c.mockapi.io/api/v1";

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  instructor: string;
  price: number;
  duration: number;
  thumbnail: string;
  trailerUrl: string;
  createdAt: string;
}

export type CourseInput = Omit<Course, "id">;
export type CategoryInput = Omit<Category, "id">;

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Lỗi API ${response.status}: ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

// ===== CATEGORIES =====

export const getCategories = () =>
  request<Category[]>("/categories");

export const createCategory = (data: CategoryInput) =>
  request<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateCategory = (
  id: string,
  data: CategoryInput
) =>
  request<Category>(`/categories/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteCategory = (id: string) =>
  request<Category>(`/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

// ===== COURSES =====

export const getCourses = () =>
  request<Course[]>("/courses");

export const getCourseById = (id: string) =>
  request<Course>(`/courses/${encodeURIComponent(id)}`);

export const createCourse = (data: CourseInput) =>
  request<Course>("/courses", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateCourse = (
  id: string,
  data: CourseInput
) =>
  request<Course>(`/courses/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteCourse = (id: string) =>
  request<Course>(`/courses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
