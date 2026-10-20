import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Quản lý khóa học",
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="course/[id]"
          options={{
            title: "Chi tiết khóa học",
            headerBackTitle: "Quay lại",
          }}
        />

        <Stack.Screen
          name="course/form"
          options={{
            title: "Thêm / Sửa khóa học",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="categories"
          options={{
            title: "Quản lý danh mục",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
