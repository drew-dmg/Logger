#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn health_check() -> String {
  "ok".to_string()
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![health_check])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
