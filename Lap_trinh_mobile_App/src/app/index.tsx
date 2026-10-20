import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Category, Course, getCategories, getCourses } from "../services/api";

export default function HomeScreen() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadData() {
        try {
          if (active) setError("");

          const [courseData, categoryData] = await Promise.all([
            getCourses(),
            getCategories(),
          ]);

          if (active) {
            setCourses(courseData);
            setCategories(categoryData);
          }
        } catch (e) {
          if (active) setError("Không thể tải dữ liệu MockAPI.");
        } finally {
          if (active) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      }

      loadData();

      return () => {
        active = false;
      };
    }, []),
  );

  const refresh = async () => {
    setRefreshing(true);
    try {
      const [courseData, categoryData] = await Promise.all([
        getCourses(),
        getCategories(),
      ]);
      setCourses(courseData);
      setCategories(categoryData);
      setError("");
    } catch {
      setError("Không thể làm mới dữ liệu.");
    } finally {
      setRefreshing(false);
    }
  };

  const getCategoryName = (id: string) =>
    categories.find((cat) => String(cat.id) === String(id))?.name ||
    "Chưa phân loại";

  const filteredCourses = courses.filter((course) => {
    const matchSearch = (course.title || "")
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchCategory =
      selectedCategory === "all" ||
      String(course.categoryId) === selectedCategory;

    return matchSearch && matchCategory;
  });

  const openCourse = (id: string) => {
    router.push(`/course/${id}` as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý khóa học</Text>
        <Text style={styles.subtitle}>Danh sách các khóa học từ MockAPI</Text>
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.heading}>Khóa học ({courses.length})</Text>

        <View style={{ gap: 8, alignItems: "flex-end" }}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/course/form" as any)}
          >
            <Text style={styles.addText}>+ Thêm khóa học</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: "#2563EB",
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 10,
            }}
            onPress={() => router.push("/categories" as any)}
          >
            <Text style={styles.addText}>Quản lý danh mục</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Tìm kiếm khóa học..."
        placeholderTextColor="#9CA3AF"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: "all", name: "Tất cả" }, ...categories]}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.chip,
                selectedCategory === String(item.id) && styles.activeChip,
              ]}
              onPress={() => setSelectedCategory(String(item.id))}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedCategory === String(item.id) && styles.activeChipText,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2563EB"
          style={{ marginTop: 60 }}
        />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={styles.retry}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Không tìm thấy khóa học nào.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => openCourse(item.id)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: item.thumbnail }}
                style={styles.thumbnail}
              />

              <View style={styles.cardBody}>
                <Text style={styles.category}>
                  {getCategoryName(item.categoryId)}
                </Text>

                <Text style={styles.courseTitle}>{item.title}</Text>

                <Text style={styles.instructor}>
                  Giảng viên: {item.instructor}
                </Text>

                <View style={styles.footer}>
                  <Text style={styles.price}>
                    {Number(item.price).toLocaleString("vi-VN")} đ
                  </Text>

                  <Text style={styles.duration}>{item.duration} giờ</Text>
                </View>

                <Text style={styles.link}>Xem chi tiết →</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  header: {
    backgroundColor: "#2563EB",
    padding: 24,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitle: {
    color: "#DBEAFE",
    marginTop: 8,
  },
  toolbar: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  addButton: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },
  search: {
    marginHorizontal: 16,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    color: "#111827",
  },
  filterRow: {
    paddingLeft: 16,
    paddingVertical: 14,
    minHeight: 68,
  },
  chip: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: "#2563EB",
  },
  chipText: {
    color: "#374151",
    fontSize: 13,
  },
  activeChipText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 18,
    elevation: 3,
  },
  thumbnail: {
    height: 170,
    width: "100%",
    backgroundColor: "#E5E7EB",
  },
  cardBody: {
    padding: 16,
  },
  category: {
    color: "#2563EB",
    fontWeight: "bold",
    fontSize: 12,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 6,
  },
  instructor: {
    color: "#6B7280",
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  price: {
    color: "#16A34A",
    fontSize: 18,
    fontWeight: "bold",
  },
  duration: {
    color: "#6B7280",
  },
  link: {
    color: "#2563EB",
    textAlign: "right",
    marginTop: 12,
    fontWeight: "600",
  },
  center: {
    alignItems: "center",
    padding: 24,
  },
  error: {
    color: "#DC2626",
  },
  retry: {
    color: "#2563EB",
    marginTop: 16,
  },
  empty: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 50,
  },
});
