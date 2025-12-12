import { FFmpeg } from "@ffmpeg/ffmpeg";
import coreURL from "@ffmpeg/core?url";
import { fetchFile } from "@ffmpeg/util";

// --- DOM Elements ---
const input = document.getElementById("imageInput");
// Thêm DOM element cho Audio Input
const audioInput = document.getElementById("audioInput");
const preview = document.getElementById("videoPreview");
const btn = document.getElementById("btnCreate");
const loading = document.getElementById("loading");
const btnDownload = document.getElementById("btnDownload");

let files = [];
let audioFile = null; // Biến để lưu trữ file audio
const DURATION_PER_IMAGE = 2; // Thời lượng hiển thị mỗi ảnh (giây)

// --- Event Listeners ---
input.addEventListener("change", (e) => {
  files = Array.from(e.target.files);
});

// Thêm Event Listener cho Audio Input
audioInput.addEventListener("change", (e) => {
  // Lấy file đầu tiên được chọn
  audioFile = e.target.files[0] || null;
});

btn.addEventListener("click", async () => {
  if (!files.length) return alert("Chọn ảnh trước!");

  // 1. Hiện loading và ẩn nút
  loading.style.display = "block";
  btn.style.display = "none";
  btnDownload.style.display = "none";

  const ffmpeg = new FFmpeg();

  // Khởi tạo một mảng lệnh mới
  let cmd = [];

  // Tên file video tạm thời, không có audio
  const tempVideoFile = "temp_video.mp4";
  const finalVideoFile = "output.mp4";
  const audioFileName = "input_audio.mp4"; // Tên file audio trong VFS

  try {
    // 2. Tải core FFmpeg
    await ffmpeg.load({ coreURL });

    // 3. Ghi ảnh vào hệ thống file ảo (VFS) và tạo list.txt
    let listContent = "";
    for (let i = 0; i < files.length; i++) {
      const fileName = `img${i}.jpg`;
      const data = await fetchFile(files[i]);
      await ffmpeg.writeFile(fileName, data);

      listContent += `file '${fileName}'\nduration ${DURATION_PER_IMAGE}\n`;
    }

    if (files.length > 0) {
      listContent += `file 'img${files.length - 1}.jpg'\n`;
    }

    await ffmpeg.writeFile("list.txt", listContent);

    // 4. Lệnh tạo video từ ảnh (video stream)
    cmd = [
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "list.txt",

      "-filter_complex",
      `scale=1080:1920:force_original_aspect_ratio=decrease,
       pad=1080:1920:(ow-iw)/2:(oh-ih)/2,
       fps=30`,

      "-r",
      "30",
      "-preset",
      "veryfast",
      "-b:v",
      "5M",
      "-an", // Bỏ audio (vì video này chưa có audio)
      tempVideoFile, // Xuất ra file video tạm thời
    ];

    console.log("Bước 1: Tạo video từ ảnh...");
    await ffmpeg.exec(cmd);

    // 5. Kiểm tra và ghép âm thanh
    if (audioFile) {
      console.log("Bước 2: Ghi và ghép âm thanh...");

      // Ghi file audio vào VFS
      const audioData = await fetchFile(audioFile);
      await ffmpeg.writeFile(audioFileName, audioData);

      // Lệnh ghép video (tempVideoFile) và audio (audioFileName)
      cmd = [
        "-i",
        tempVideoFile, // Input 0: Video stream (từ ảnh)
        "-i",
        audioFileName, // Input 1: Audio stream (từ người dùng)
        "-c:v",
        "copy", // Giữ nguyên mã hóa video (tiết kiệm thời gian)
        "-c:a",
        "aac", // Mã hóa lại audio sang AAC (tương thích)
        "-b:a",
        "192k", // Bitrate audio
        "-shortest", // Video sẽ kết thúc khi audio kết thúc (hoặc ngược lại)
        finalVideoFile, // File output cuối cùng
      ];

      await ffmpeg.exec(cmd);
    } else {
      // Nếu không có audio, output cuối cùng chính là video tạm thời
      await ffmpeg.rename(tempVideoFile, finalVideoFile);
    }

    // 6. Đọc kết quả
    const data = await ffmpeg.readFile(finalVideoFile);
    const blob = new Blob([data.buffer], { type: "video/mp4" });
    const url = URL.createObjectURL(blob);

    // 7. Hiển thị video và nút tải xuống (Giữ nguyên)
    preview.src = url;
    btnDownload.style.display = "inline-block";
    btnDownload.onclick = () => {
      const a = document.createElement("a");
      a.href = url;
      a.download = "slideshow.mp4";
      a.click();
    };

    // 8. Dọn dẹp bộ nhớ (Rất quan trọng)
    // console.log("Bước 3: Dọn dẹp bộ nhớ...");
    // await ffmpeg.delete(tempVideoFile);
    // await ffmpeg.delete(finalVideoFile);
    // await ffmpeg.delete("list.txt");
    // if (audioFile) await ffmpeg.delete(audioFileName);
    // for (let i = 0; i < files.length; i++) {
    //   await ffmpeg.delete(`img${i}.jpg`);
    // }
  } catch (error) {
    console.error("Lỗi khi tạo video:", error);
    alert("Đã xảy ra lỗi trong quá trình tạo video. Vui lòng kiểm tra console.");
  } finally {
    // 9. Tắt loading và hiện nút tạo
    loading.style.display = "none";
    btn.style.display = "inline-block";
  }
});
