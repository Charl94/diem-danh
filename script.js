/*
 * ==================================
 * File: script.js (Frontend Logic)
 * ĐÃ CẬP NHẬT: Ẩn cột Mã NV, Vị Trí trên web
 * ==================================
 */

// Dán URL Web App của bạn vào đây
const API_URL = "https://script.google.com/macros/s/AKfycbwzHD4FNzs1N3V5OfI0g4bd65cGk0X1z66WrXjzl05cCd5ynocxNv6Htwc3tRMBmZciwg/exec"; // <<< THAY URL CỦA BẠN VÀO ĐÂY

let currentUserName = ""; // Lưu tên người đăng nhập

// Lấy các phần tử DOM
const loginSection = document.getElementById('login-section');
const welcomeSection = document.getElementById('welcome-section');
const mainContainer = document.getElementById('main-container');
const messageEl = document.getElementById('message');
const loginButton = document.getElementById('login-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

// --- HÀM TÍNH NGÀY ĐIỂM DANH ---
function getAttendanceDateString() {
    const now = new Date();
    if (now.getHours() < 6) { now.setDate(now.getDate() - 1); }
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    return `${year}-${month}-${day}`;
}

// --- HÀM ĐẶT NGÀY VÀO Ô INPUT ---
function setAttendanceDate() {
    const dateInput = document.getElementById('attendance-date');
    if (dateInput) { dateInput.value = getAttendanceDateString(); }
}

// --- HÀM XỬ LÝ ĐĂNG NHẬP ---
async function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
        messageEl.style.color = "red";
        messageEl.innerText = "Vui lòng nhập đủ Mã NV và Mật khẩu.";
        return;
    }
    loginButton.disabled = true; loginButton.innerText = "Đang xử lý...";
    messageEl.style.color = "blue"; messageEl.innerText = "Đang kết nối...";
    try {
        const response = await fetch(API_URL, {
            method: 'POST', redirect: 'follow',
            body: JSON.stringify({ action: 'login', username: username, password: password }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const result = await response.json();
        if (result.success) {
            currentUserName = result.name; // Lưu tên
            showDashboard(result.name, result.groups);
        } else {
            messageEl.style.color = "red"; messageEl.innerText = result.message;
            loginButton.disabled = false; loginButton.innerText = "Đăng Nhập";
        }
    } catch (error) {
        messageEl.style.color = "red"; messageEl.innerText = "Lỗi kết nối. Vui lòng thử lại.";
        loginButton.disabled = false; loginButton.innerText = "Đăng Nhập";
    }
}

// --- HÀM HIỂN THỊ GIAO DIỆN LÀM VIỆC ---
function showDashboard(name, groups) {
    loginSection.style.display = 'none';
    welcomeSection.style.display = 'block';
    mainContainer.style.maxWidth = '800px'; // Giữ nguyên 800px cho rộng rãi
    document.getElementById('welcome-message').innerText = `Chào, ${name}!`;

    const dropdown = document.getElementById('group-dropdown');
    dropdown.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = ""; defaultOption.text = "-Chọn danh sách-";
    dropdown.appendChild(defaultOption);
    
    groups.forEach(groupName => {
        const option = document.createElement('option');
        option.value = groupName; option.text = groupName;
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
    const actionButtons = document.querySelector('.table-actions');
    
    listContainer.innerHTML = ''; 
    spinner.style.display = 'block';
    actionButtons.style.display = 'none'; 

    try {
        const response = await fetch(API_URL, {
            method: 'POST', redirect: 'follow',
            body: JSON.stringify({ action: 'getEmployees', groupName: groupName }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const result = await response.json();
        spinner.style.display = 'none'; 
        if (result.success) {
            createEmployeeTable(result.data); // Sẽ tạo bảng 5 cột hiển thị
            actionButtons.style.display = 'flex'; 
        } else {
            listContainer.innerHTML = `<p style.color = "red"; text-align: center;">${result.message}</p>`;
        }
    } catch (error) {
        spinner.style.display = 'none'; 
        listContainer.innerHTML = `<p style="color: red"; text-align: center;">Lỗi kết nối. Không thể tải danh sách.</p>`;
    }
}

// --- (CẬP NHẬT) HÀM TẠO BẢNG 5 CỘT + DATA ATTRIBUTES ---
function createEmployeeTable(employees) {
    const listContainer = document.getElementById('employee-table-container');
    listContainer.innerHTML = ''; 

    if (!employees || employees.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center;">Không có nhân viên nào trong tổ này.</p>';
    }

    const table = document.createElement('table');
    table.className = 'employee-table';
    const thead = document.createElement('thead');
    // Bỏ Mã NV, Vị Trí khỏi header
    thead.innerHTML = `
        <tr>
            <th class="col-stt">STT</th>
            <th class="col-ten">Họ và Tên</th>
            <th class="col-check">Có Làm</th>
            <th class="col-check">Vắng</th>
            <th class="col-ghichu">Ghi Chú</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    employees.forEach((emp, index) => {
        const tr = document.createElement('tr');
        // (MỚI) Thêm data attributes vào <tr> để lưu dữ liệu ẩn
        tr.setAttribute('data-manv', emp.maNV || ''); // Dùng || '' để tránh lỗi undefined
        tr.setAttribute('data-vitri', emp.viTri || '');
        
        const radioName = `check_emp_${index}`; 
        // Bỏ Mã NV, Vị Trí khỏi các ô <td>
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

// --- (CẬP NHẬT) HÀM THÊM DÒNG MỚI 5 CỘT ---
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
    
    // (MỚI) Dòng mới cũng cần data attributes (để trống)
    newRow.setAttribute('data-manv', ''); 
    newRow.setAttribute('data-vitri', '');
    
    // Bỏ input cho Mã NV, Vị Trí
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

// --- (CẬP NHẬT) HÀM XỬ LÝ GỬI (Lấy dữ liệu ẩn từ data attributes) ---
async function handleSubmit() {
    const allRows = document.querySelectorAll(".employee-table tbody tr");
    if (allRows.length === 0) {
        alert("Không có dữ liệu để gửi.");
        return;
    }

    let allValid = true;
    const dataToSend = [];
    const attendanceDate = document.getElementById('attendance-date').value;
    const groupName = document.getElementById('group-dropdown').value;
    
    const submitButton = document.getElementById('submit-btn');
    const addButton = document.getElementById('add-row-btn');

    allRows.forEach(row => { row.classList.remove('row-highlight-error'); });

    allRows.forEach((row, index) => {
        // Lấy dữ liệu hiển thị (5 cột)
        const stt = row.cells[0].innerText || row.cells[0].querySelector('input')?.value;
        const hoTen = row.cells[1].innerText || row.cells[1].querySelector('input')?.value;
        const radioName = row.querySelector('.radio-check')?.getAttribute('name');
        const checkedRadio = row.querySelector(`input[name="${radioName}"]:checked`);
        const status = checkedRadio ? checkedRadio.value : null;
        const note = row.cells[4].querySelector('.notes-input').value; // Ghi chú là cột 4 (0-based)

        // (MỚI) Lấy dữ liệu ẩn từ data attributes
        const maNV = row.getAttribute('data-manv');
        const viTri = row.getAttribute('data-vitri');

        // Kiểm tra lỗi
        let rowHasError = false;
        if (!status) { rowHasError = true; } 
        const hoTenInput = row.cells[1].querySelector('input');
        if (hoTenInput && !hoTenInput.value.trim()) { rowHasError = true; } 
        if (rowHasError) {
            allValid = false;
            row.classList.add('row-highlight-error');
        }
        
        // Thêm maNV, viTri vào object gửi đi
        dataToSend.push({ stt, hoTen, maNV, viTri, status, note });
    });

    if (!allValid) {
        alert("Vui lòng kiểm tra lại. Một số dòng (tô đỏ) chưa được tick hoặc chưa nhập Họ Tên.");
        return; 
    }

    // Gửi dữ liệu thật
    try {
        submitButton.disabled = true; addButton.disabled = true;
        submitButton.innerText = "Đang gửi...";
        const response = await fetch(API_URL, {
            method: 'POST', redirect: 'follow',
            body: JSON.stringify({ 
                action: 'submitAttendance',
                groupName: groupName, date: attendanceDate,
                userName: currentUserName, data: dataToSend
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const result = await response.json();
        if (result.success) {
            alert("Cảm ơn bạn đã gửi khảo sát.");
            document.getElementById('employee-list-area').style.display = 'none';
            document.getElementById('group-dropdown').value = "";
        } else { throw new Error(result.message); }
    } catch (error) {
        alert("Gửi thất bại! Lỗi: " + error.message);
    } finally {
        submitButton.disabled = false; addButton.disabled = false;
        submitButton.innerText = "Gửi";
    }
}


// --- GÁN SỰ KIỆN KHI TRANG TẢI XONG ---
document.addEventListener('DOMContentLoaded', (event) => {
    setAttendanceDate();
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) { loginBtn.onclick = handleLogin; }
    const passInput = document.getElementById('password');
    if (passInput) {
        passInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') { handleLogin(); }
        });
    }
    const addRowBtn = document.getElementById('add-row-btn');
    if (addRowBtn) { addRowBtn.onclick = addNewEmployeeRow; }
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) { submitBtn.onclick = handleSubmit; }
});
