// OTTv2 Arena launcher.
// The actual game and multiplayer synchronization run in play.html via playhtml.
// Start the static web host first with: npm start
#include <iostream>
#include <string>

#ifdef _WIN32
#include <windows.h>
#else
#include <cstdlib>
#endif

int main(int argc, char* argv[]) {
    std::string url = (argc >= 2) ? argv[1] : "http://localhost:6767/play.html";

    std::cout << "OTTv2 Arena\n";
    std::cout << "Opening: " << url << "\n";
    std::cout << "If the page cannot open, start the web host in the project folder:\n";
    std::cout << "  npm start\n\n";

#ifdef _WIN32
    auto result = reinterpret_cast<INT_PTR>(
        ShellExecuteA(nullptr, "open", url.c_str(), nullptr, nullptr, SW_SHOWNORMAL));
    if (result <= 32) {
        std::cerr << "Khong mo duoc trinh duyet. Hay mo link tren bang tay.\n";
        std::cerr << "Link: " << url << "\n";
        return 1;
    }
#else
    std::string command = "xdg-open \"" + url + "\" >/dev/null 2>&1";
    if (std::system(command.c_str()) != 0) {
        std::cerr << "Khong mo duoc trinh duyet. Hay mo link tren bang tay:\n";
        std::cerr << url << "\n";
        return 1;
    }
#endif
    std::cout << "Da gui yeu cau mo trinh duyet. Bam nut 'Tao phong moi' de bat dau.\n";
    return 0;
}
