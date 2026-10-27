#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <cstring>
#ifdef _WIN32
#include <winsock2.h>
#pragma comment(lib, "ws2_32.lib")
#else
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#endif

bool recvLine(int sock, std::string& line) {
    line.clear();
    char c;
    while (true) {
        int r = recv(sock, &c, 1, 0);
        if (r <= 0) return false;
        if (c == '\n') return true;
        line += c;
    }
}

int main() {
#ifdef _WIN32
    WSADATA wsa;
    WSAStartup(MAKEWORD(2, 2), &wsa);
#endif

    int serverSock = socket(AF_INET, SOCK_STREAM, 0);
    sockaddr_in server{};
    server.sin_family = AF_INET;
    server.sin_port = htons(8080);
    server.sin_addr.s_addr = INADDR_ANY;

    if (bind(serverSock, (sockaddr*)&server, sizeof(server)) < 0) {
        std::cerr << "Bind that bai!\n";
        return 1;
    }

    listen(serverSock, 5);
    std::cout << "Server dang lang nghe cong 8080...\n";

    sockaddr_in client{};
#ifdef _WIN32
    int clientLen = sizeof(client);
#else
    socklen_t clientLen = sizeof(client);
#endif
    int clientSock = accept(serverSock, (sockaddr*)&client, &clientLen);

    std::string line;
    if (!recvLine(clientSock, line)) return 1;
    int n = std::stoi(line);

    long long sum = 0;
    for (int i = 0; i < n; ++i) {
        if (!recvLine(clientSock, line)) return 1;
        sum += std::stoll(line);
    }

    std::string msg = std::to_string(sum) + "\n";
    send(clientSock, msg.c_str(), (int)msg.size(), 0);

    if (!recvLine(clientSock, line)) return 1;

    if (line == "DUNG") {
        msg = "KET QUA: DUNG\n";
    } else {
        msg = "KET QUA: SAI\n";
    }
    send(clientSock, msg.c_str(), (int)msg.size(), 0);

    std::cout << "Client phan hoi: " << line << "\n";
    std::cout << "Da gui ket qua cho Client.\n";

#ifdef _WIN32
    closesocket(clientSock);
    closesocket(serverSock);
    WSACleanup();
#else
    close(clientSock);
    close(serverSock);
#endif
    return 0;
}
