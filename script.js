/*
 * ==================================
 * File: script.js (Frontend Logic)
 * ĐÃ CẬP NHẬT: Input type="date"
 * ==================================
 */

// Dán URL Web App của bạn vào đây
const API_URL = "https://script.google.com/macros/s/AKfycbx9d0iWCQu3uZRyM_-021zr_VSksNZn4gvyHKvhkOthOm8gwgkhKbGa4qgtuUVqeHbnqg/exec"; // <<< THAY URL CỦA BẠN VÀO ĐÂY

// Lấy các phần tử DOM
const loginSection = document.getElementById('login-section');
const welcomeSection = document.getElementById('welcome-section');
const mainContainer = document.getElementById('main-container');
const messageEl = document.getElementById('message');
const loginButton = document.getElementById('login-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

// --- (CẬP NHẬT) HÀM TÍNH NGÀY ĐIỂM DANH ---
function getAttendanceDateString() {
    const now = new Date();
    
    // Nếu trước 6h sáng (0-5h), thì vẫn tính là ngày hôm qua
    if (now.getHours() < 6) {
        now.setDate(now.getDate() - 1);
    }
    
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // +1 vì getMonth() từ 0-11
    const year = now.getFullYear();
    
    // (QUAN TRỌNG) Input type="date" yêu cầu định dạng YYYY-MM-DD
    return `${year}-${month}-${day}`;
}

// --- HÀM ĐẶT NGÀY VÀO Ô INPUT ---
function setAttendanceDate() {
    const dateInput = document.getElementById('attendance-date');
    if (dateInput) {
        dateInput.value = getAttendanceDateString();
    }
}

// --- HÀM XỬ LÝ ĐĂNG NHẬP ---
async function handleLogin() {
    // ... code giữ nguyên ...
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
        messageEl.style.color = "red";
        messageEl.innerText = "Vui lòng nhập đủ Mã NV và Mật khẩu.";
        return;
    }
    loginButton.disabled = true;
    loginButton.innerText = "Đang xử lý...";
    messageEl.style.color = "blue";
    messageEl.innerText = "Đang kết nối...";
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            body: JSON.stringify({ action: 'login', username: username, password: password }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const result = await response.json();
        if (result.success) {
            showDashboard(result.name, result.groups);
        } else {
            messageEl.style.color = "red";
            messageEl.innerText = result.message;
            loginButton.disabled = false;
            loginButton.innerText = "Đăng Nhập";
        }
    } catch (error) {
        messageEl.style.color = "red";
        messageEl.innerText = "Lỗi kết nối. Vui lòng thử lại.";
        loginButton.disabled = false;
        loginButton.innerText = "Đăng Nhập";
    }
}

// --- HÀM HIỂN THỊ GIAO DIỆN LÀM VIỆC ---
function showDashboard(name, groups) {
    // ... code giữ nguyên ...
    loginSection.style.display = 'none';
    welcomeSection.style.display = 'block';
    mainContainer.style.maxWidth = '800px';
    document.getElementById('welcome-message').innerText = `Chào, ${name}!`;

    const dropdown = document.getElementById('group-dropdown');
    dropdown.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.text = "--Chọn List--";
    dropdown.appendChild(defaultOption);
    
    groups.forEach(groupName => {
        const option = document.createElement('option');
        option.value = groupName;
        option.text = groupName;
        dropdown.appendChild(option);
    });

    dropdown.onchange = () => {
        const selectedGroup = dropdown.value;
        if (selectedGroup) {
            document.getElementById('employee-list-area').style.display = 'block';
            document.getElementById('employee-list-title').style.display = 'block';
            document.getElementById('employee-list-title').innerText = `Danh sách nhân viên: ${selectedGroup}`;
            loadEmployeeList(selectedGroup);
        } else {
            document.getElementById('employee-list-area').style.display = 'none';
        }
    };
}

// --- HÀM TẢI DANH SÁCH NHÂN VIÊN ---
async function loadEmployeeList(groupName) {
    // ... code giữ nguyên ...
    const listContainer = document.getElementById('employee-table-container');
    const spinner = document.getElementById('loading-spinner');
    const actionButtons = document.querySelector('.table-actions'); 
    
    listContainer.innerHTML = ''; 
    spinner.style.display = 'block'; 
    actionButtons.style.display = 'none'; 

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            body: JSON.stringify({ action: 'getEmployees', groupName: groupName }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        const result = await response.json();
        spinner.style.display = 'none'; 
        
        if (result.success) {
            createEmployeeTable(result.data);
            actionButtons.style.display = 'flex'; 
        } else {
            listContainer.innerHTML = `<p style="color: red; text-align: center;">${result.message}</p>`;
        }
    } catch (error) {
        spinner.style.display = 'none'; 
        listContainer.innerHTML = `<p style="color: red; text-align: center;">Lỗi kết nối. Không thể tải danh sách.</p>`;
        console.error("Lỗi Fetch (getEmployees):", error);
    }
}

// --- HÀM TẠO BẢNG NHÂN VIÊN ---
function createEmployeeTable(employees) {
    // ... code giữ nguyên ...
    const listContainer = document.getElementById('employee-table-container');
    listContainer.innerHTML = ''; 

    if (!employees || employees.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center;">Không có nhân viên nào trong tổ này.</p>';
    }

    const table = document.createElement('table');
    table.className = 'employee-table';
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th class="col-stt">STT</th>
            <th class="col-ten">Họ và Tên</th>
            <th class="col-check">Có Đi Làm</th>
            <th class="col-check">Vắng</th>
            <th class="col-ghichu">Ghi Chú</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    employees.forEach((emp, index) => {
        const tr = document.createElement('tr');
        const radioName = `check_emp_${index}`; 
        tr.innerHTML = `
            <td>${emp.stt}</td>
            <td>${emp.hoTen}</td>
            <td class="cell-center">
                <input type="radio" name="${radioName}" value="present" class="radio-check">
            </td>
            <td class="cell-center">
                <input type="radio" name="${radioName}" value="absent" class="radio-check">
            </td>
            <td>
                <input type="text" class="notes-input" placeholder="Ghi chú...">
            </td>
        `;
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    listContainer.appendChild(table);
}

// --- HÀM THÊM DÒNG MỚI VÀO BẢNG ---
function addNewEmployeeRow() {
    // ... code giữ nguyên ...
    let tableBody = document.querySelector(".employee-table tbody");
    if (!tableBody) {
        const listContainer = document.getElementById('employee-table-container');
        listContainer.innerHTML = ''; 
        createEmployeeTable([]); 
        tableBody = document.querySelector(".employee-table tbody");
    }

    const newRowIndex = tableBody.rows.length;
    const radioName = `check_new_${newRowIndex}`;
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td>
            <input type="text" class="new-row-input" placeholder="STT">
        </td>
        <td>
            <input type="text" class="new-row-input" placeholder="Họ và tên...">
        </td>
        <td class="cell-center">
            <input type="radio" name="${radioName}" value="present" class="radio-check">
        </td>
        <td class="cell-center">
            <input type="radio" name="${radioName}" value="absent" class="radio-check">
        </td>
        <td>
            <input type="text" class="notes-input" placeholder="Ghi chú...">
        </td>
    `;
    
    tableBody.appendChild(newRow); 
}

// --- HÀM XỬ LÝ GỬI ---
function handleSubmit() {
    // ... code giữ nguyên (nó đã lấy giá trị từ attendance-date) ...
    const allRows = document.querySelectorAll(".employee-table tbody tr");
    if (allRows.length === 0) {
        alert("Không có dữ liệu để gửi.");
        return;
    }

    let allValid = true;
    const dataToSend = [];
    
    const attendanceDate = document.getElementById('attendance-date').value;

    allRows.forEach(row => {
        row.classList.remove('row-highlight-error');
    });

    allRows.forEach((row, index) => {
        const stt = row.cells[0].innerText || row.cells[0].querySelector('input')?.value;
        const hoTen = row.cells[1].innerText || row.cells[1].querySelector('input')?.value;
        const radioName = row.querySelector('.radio-check')?.getAttribute('name');
        const checkedRadio = row.querySelector(`input[name="${radioName}"]:checked`);
        const status = checkedRadio ? checkedRadio.value : null;
        const note = row.querySelector('.notes-input').value;

        let rowHasError = false;
        if (!status) { 
            rowHasError = true;
        }
        const hoTenInput = row.cells[1].querySelector('input');
        if (hoTenInput && !hoTenInput.value.trim()) {
             rowHasError = true;
        }
        if (rowHasError) {
            allValid = false;
            row.classList.add('row-highlight-error');

        }
        
        dataToSend.push({ stt, hoTen, status, note });
    });

    if (allValid) {
        alert("Cảm ơn bạn đã gửi khảo sát.");
        console.log("Ngày điểm danh:", attendanceDate); 
        console.log("Dữ liệu chuẩn bị gửi:", dataToSend);
        
        document.getElementById('employee-list-area').style.display = 'none';
        document.getElementById('group-dropdown').value = "";

    } else {
        alert("Vui lòng kiểm tra lại. Một số dòng (tô đỏ) chưa được tick hoặc chưa nhập Họ Tên.");
    }
}


// --- GÁN SỰ KIỆN KHI TRANG TẢI XONG (CẬP NHẬT) ---
document.addEventListener('DOMContentLoaded', (event) => {
    
    // (CẬP NHẬT) Đặt ngày điểm danh ngay khi tải trang
    setAttendanceDate();

    // Gán sự kiện cho nút Đăng nhập
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.onclick = handleLogin;
    }
    
    // Gán sự kiện cho phím Enter ở ô mật khẩu
    const passInput = document.getElementById('password');
    if (passInput) {
        passInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }

    // Gán sự kiện cho nút Thêm
    const addRowBtn = document.getElementById('add-row-btn');
    if (addRowBtn) {
        addRowBtn.onclick = addNewEmployeeRow;
    }

    // Gán sự kiện cho nút Gửi
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.onclick = handleSubmit;
    }
});
