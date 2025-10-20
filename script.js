/*
 * ==================================
 * File: script.js (Frontend Logic)
 * ĐÃ CẬP NHẬT: Bỏ Mã NV
 * ==================================
 */

// Dán URL Web App của bạn vào đây
const API_URL = "https://script.google.com/macros/s/AKfycbx9S6TYdb6ZV60z1CWZ6Oi9WvXuidCrUT3M1nZ9mGK38iwZ6ScziFXOB1PQN7H3R7mmpA/exec"; // <<< THAY URL CỦA BẠN VÀO ĐÂY

// Lấy các phần tử DOM
const loginSection = document.getElementById('login-section');
const welcomeSection = document.getElementById('welcome-section');
const mainContainer = document.getElementById('main-container');
const messageEl = document.getElementById('message');
const loginButton = document.getElementById('login-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

// --- HÀM XỬ LÝ ĐĂNG NHẬP ---
async function handleLogin() {
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
    loginSection.style.display = 'none';
    welcomeSection.style.display = 'block';
    mainContainer.style.maxWidth = '800px';
    document.getElementById('welcome-message').innerText = `Chào, ${name}!`;

    const dropdown = document.getElementById('group-dropdown');
    dropdown.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.text = "-- Vui lòng chọn một tổ --";
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
    const listContainer = document.getElementById('employee-table-container');
    const spinner = document.getElementById('loading-spinner');
    
    listContainer.innerHTML = ''; 
    spinner.style.display = 'block'; 

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
        } else {
            listContainer.innerHTML = `<p style="color: red; text-align: center;">${result.message}</p>`;
        }
    } catch (error) {
        spinner.style.display = 'none'; 
        listContainer.innerHTML = `<p style="color: red; text-align: center;">Lỗi kết nối. Không thể tải danh sách.</p>`;
        console.error("Lỗi Fetch (getEmployees):", error);
    }
}

// --- HÀM TẠO BẢNG NHÂN VIÊN (ĐÃ CẬP NHẬT) ---
function createEmployeeTable(employees) {
    const listContainer = document.getElementById('employee-table-container');
    listContainer.innerHTML = ''; 

    if (!employees || employees.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center;">Không có nhân viên nào trong tổ này.</p>';
    }

    const table = document.createElement('table');
    table.className = 'employee-table';

    // (CẬP NHẬT) Tiêu đề 5 cột
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

    // (CẬP NHẬT) Nội dung 5 cột
    const tbody = document.createElement('tbody');
    employees.forEach((emp, index) => {
        const tr = document.createElement('tr');
        // Dùng index để đảm bảo radio name là duy nhất
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

// --- HÀM THÊM DÒNG MỚI VÀO BẢNG (ĐÃ CẬP NHẬT) ---
function addNewEmployeeRow() {
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
    
    // (CẬP NHẬT) Dòng mới 5 cột
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

// --- HÀM XỬ LÝ GỬI (ĐÃ CẬP NHẬT) ---
function handleSubmit() {
    alert("Nút 'Gửi điểm danh' đã được bấm! (Chức năng demo)");
    
    const allRows = document.querySelectorAll(".employee-table tbody tr");
    const data = [];
    allRows.forEach((row, index) => {
        
        // (CẬP NHẬT) Lấy dữ liệu theo 5 cột
        const stt = row.cells[0].innerText || row.cells[0].querySelector('input')?.value;
        const hoTen = row.cells[1].innerText || row.cells[1].querySelector('input')?.value;
        
        const radioName = row.querySelector('.radio-check')?.getAttribute('name');
        const checkedRadio = row.querySelector(`input[name="${radioName}"]:checked`);
        const status = checkedRadio ? checkedRadio.value : 'chưa_check';
        
        const note = row.querySelector('.notes-input').value;
        
        // Bỏ maNV
        data.push({ stt, hoTen, status, note });
    });
    console.log("Dữ liệu chuẩn bị gửi:", data);
}


// --- GÁN SỰ KIỆN KHI TRANG TẢI XONG ---
document.addEventListener('DOMContentLoaded', (event) => {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.onclick = handleLogin;
    }
    
    const passInput = document.getElementById('password');
    if (passInput) {
        passInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }

    const addRowBtn = document.getElementById('add-row-btn');
    if (addRowBtn) {
        addRowBtn.onclick = addNewEmployeeRow;
    }

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.onclick = handleSubmit;
    }
});
