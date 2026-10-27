OTTv2 Arena - bản cập nhật

1. Thay play.html bằng updated_play.html (đổi tên thành play.html).
2. Thay client.cpp bằng updated_client.cpp (đổi tên thành client.cpp) nếu muốn dùng C++ để mở trình duyệt.
3. Trong thư mục dự án, chạy `npm start`.
4. Mở http://localhost:6767/play.html hoặc chạy launcher C++.
5. Bấm “Tạo phòng mới”, sau đó gửi link mời cho người chơi thứ hai. Người thứ ba có thể spectate.

Lưu ý quan trọng:
- client.cpp ban đầu là client TCP cho bài tập tính tổng N số, không phải client của OTTv2. Trò chơi OTTv2 chạy trong trình duyệt; playhtml lo việc đồng bộ. Bản client.cpp mới chỉ là launcher mở trình duyệt, không thay thế server web.
- Người chơi khác máy cần dùng cùng địa chỉ host LAN (ví dụ http://IP-MAY-HOST:6767/play.html), và cần mở cổng 6767 trên firewall nếu Windows chặn.
- Vì playhtml đồng bộ dữ liệu theo hostname, không nên để người này vào localhost còn người kia vào địa chỉ IP; mọi người nên dùng cùng một hostname/IP.
