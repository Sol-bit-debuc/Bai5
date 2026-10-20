
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useLocalSearchParams,
  useRouter,
  useFocusEffect,
} from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  Course,
  Category,
  getCourseById,
  getCategories,
  deleteCourse,
} from "../../services/api";

function TrailerPlayer({ url }: { url: string }) {
  const player = useVideoPlayer(url);

  return (
    <VideoView
      player={player}
      style={styles.video}
      nativeControls
    />
  );
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadData() {
        if (!id) {
          if (active) {
            setError("Không tìm thấy ID khóa học.");
            setLoading(false);
          }
          return;
        }

        try {
          setLoading(true);
          setError("");

          const [courseData, categoryData] = await Promise.all([
            getCourseById(id),
            getCategories(),
          ]);

          if (active) {
            setCourse(courseData);
            setCategories(categoryData);
          }
        } catch {
          if (active) {
            setError("Không thể tải thông tin khóa học.");
          }
        } finally {
          if (active) setLoading(false);
        }
      }

      loadData();

      return () => {
        active = false;
        setShowTrailer(false);
      };
    }, [id])
  );

  const handleEdit = () => {
    router.push({
      pathname: "/course/form" as any,
      params: { id: String(id) },
    });
  };

  const performDelete = async () => {
    if (!id || deleting) return;

    setDeleting(true);

    try {
      await deleteCourse(id);
      router.replace("/");
    } catch {
      Alert.alert(
        "Lỗi",
        "Không thể xóa khóa học. Hãy thử lại."
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = () => {
    if (Platform.OS === "web") {
      // React Native Web chạy trên trình duyệt
      const confirmed = window.confirm(
        "Bạn có chắc muốn xóa khóa học này?"
      );

      if (confirmed) performDelete();
      return;
    }

    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa khóa học này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: performDelete,
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>{error || "Không tìm thấy khóa học."}</Text>
        <TouchableOpacity onPress={() => router.replace("/")}>
          <Text style={styles.link}>Về danh sách</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const categoryName =
    categories.find(
      (cat) => String(cat.id) === String(course.categoryId)
    )?.name || "Chưa phân loại";

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView>
        <Image
          source={{ uri: course.thumbnail }}
          style={styles.image}
        />

        <View style={styles.content}>
          <Text style={styles.category}>{categoryName}</Text>

          <Text style={styles.title}>{course.title}</Text>

          <Text style={styles.info}>
            Giảng viên: {course.instructor}
          </Text>

          <Text style={styles.info}>
            Thời lượng: {course.duration} giờ
          </Text>

          <Text style={styles.info}>
            Ngày tạo: {course.createdAt || "Chưa có"}
          </Text>

          <Text style={styles.price}>
            {Number(course.price).toLocaleString("vi-VN")} đ
          </Text>

          <Text style={styles.heading}>Mô tả khóa học</Text>
          <Text style={styles.description}>
            {course.description}
          </Text>

          <TouchableOpacity
            style={styles.trailerButton}
            onPress={() => setShowTrailer(!showTrailer)}
          >
            <Text style={styles.buttonText}>
              {showTrailer ? "Đóng trailer" : "▶ Xem trailer"}
            </Text>
          </TouchableOpacity>

          {showTrailer && !!course.trailerUrl && (
            <TrailerPlayer
              key={course.trailerUrl}
              url={course.trailerUrl}
            />
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
            >
              <Text style={styles.buttonText}>Sửa khóa học</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteButton,
                deleting && { opacity: 0.5 },
              ]}
              onPress={handleDelete}
              disabled={deleting}
            >
              <Text style={styles.buttonText}>
                {deleting ? "Đang xóa..." : "Xóa khóa học"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  image: {
    width: "100%",
    height: 240,
    backgroundColor: "#E5E7EB",
  },
  content: {
    padding: 20,
  },
  category: {
    color: "#2563EB",
    fontWeight: "bold",
    marginBottom: 8,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#111827",
  },
  info: {
    color: "#4B5563",
    marginTop: 12,
    fontSize: 15,
  },
  price: {
    color: "#16A34A",
    fontWeight: "bold",
    fontSize: 24,
    marginTop: 20,
  },
  heading: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 24,
    marginBottom: 10,
  },
  description: {
    color: "#4B5563",
    fontSize: 15,
    lineHeight: 24,
  },
  trailerButton: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24,
  },
  video: {
    width: "100%",
    height: 220,
    backgroundColor: "#000000",
    marginTop: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
    marginBottom: 30,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#F59E0B",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#DC2626",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
  },
  link: {
    color: "#2563EB",
    marginTop: 15,
  },
});
