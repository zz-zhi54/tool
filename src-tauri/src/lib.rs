// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            // 应用内自动更新：pubkey 由 plugins.updater.pubkey 读取，
            // 签名密钥 TAURI_SIGNING_PRIVATE_KEY 仅在 CI 构建时注入。
            #[cfg(desktop)]
            let _ = app.handle().plugin(tauri_plugin_updater::Builder::new().build());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
