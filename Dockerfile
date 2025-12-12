# STEP 1: Chọn base image
# Sử dụng Nginx stable-alpine vì nó rất nhẹ và hiệu quả cho việc phục vụ file static.
FROM nginx:stable-alpine

# STEP 2: Thiết lập môi trường và dọn dẹp
# Xóa các file HTML mặc định của Nginx để chuẩn bị cho file của chúng ta.
RUN rm -rf /usr/share/nginx/html/*

# STEP 3: Sao chép file đã build
# COPY <nguồn_trên_host> <đích_trong_container>
# Sao chép toàn bộ nội dung của thư mục 'dist' (đã build) vào thư mục phục vụ của Nginx
COPY docs /usr/share/nginx/html

# STEP 4: Mở cổng (Expose)
# Khai báo rằng container này lắng nghe trên cổng 80. 
# (Đây là cổng mặc định mà Nginx bên trong container sử dụng)
EXPOSE 80

# STEP 5: Lệnh khởi động (Command)
# Lệnh mặc định để khởi động Nginx khi container chạy, giữ nó ở foreground.
CMD ["nginx", "-g", "daemon off;"]