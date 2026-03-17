import json
import logging
import re
import time
import random

# impersonate sadece TLS parmak izi; User-Agent header'i bizim gonderdigimiz (mobil) kullanilir.
from curl_cffi import requests as curl_requests

from app_core.storage import save_token_data

logger = logging.getLogger(__name__)


class LoginError(Exception):
    def __init__(self, message, error_type="UNKNOWN", status_code=None, details=None):
        super().__init__(message)
        self.message = message
        self.error_type = error_type
        self.status_code = status_code
        self.details = details or {}

    def to_dict(self):
        return {
            "message": self.message,
            "error_type": self.error_type,
            "status_code": self.status_code,
            "details": self.details,
        }


def _parse_instagram_error(response_data):
    if not isinstance(response_data, dict):
        return None
    
    message = response_data.get("message", "")
    error_data = response_data.get("data", {})
    
    if isinstance(error_data, dict):
        for key, value in error_data.items():
            if isinstance(value, dict):
                message = value.get("message", message)
                break
    
    return message if message else None


def _extract_login_failure_reason(response_data):
    if not isinstance(response_data, dict):
        return None
    
    message = _parse_instagram_error(response_data)
    if message:
        return message
    
    if "data" in response_data:
        data = response_data.get("data", {})
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, str) and any(word in value.lower() for word in ["error", "fail", "invalid", "wrong"]):
                    return value
                if isinstance(value, dict):
                    error_msg = value.get("message") or value.get("error")
                    if error_msg:
                        return error_msg
    
    if "message" in response_data:
        return response_data.get("message")
    
    return None


def _handle_http_error(status_code, response_text):
    error_type = "UNKNOWN"
    message = "Bilinmeyen hata"
    details = {"status_code": status_code}

    if status_code == 400:
        error_type = "BAD_REQUEST"
        message = "Girdi parametreleri hatalı veya eksik"
        try:
            data = json.loads(response_text)
            parsed_msg = _parse_instagram_error(data)
            if parsed_msg:
                message = parsed_msg
                details["instagram_message"] = parsed_msg
        except Exception:
            pass
    elif status_code == 401:
        error_type = "UNAUTHORIZED"
        message = "Kullanıcı adı veya şifre hatalı"
    elif status_code == 403:
        error_type = "FORBIDDEN"
        message = "Hesaba erişim engellendi. IP veya hesap engellenmiş olabilir."
    elif status_code == 429:
        error_type = "RATE_LIMITED"
        message = "Çok fazla istek. Lütfen 15-30 dakika bekleyin."
    elif status_code == 500:
        error_type = "SERVER_ERROR"
        message = "Instagram sunucu hatası. Lütfen daha sonra tekrar deneyin."
    elif status_code == 502 or status_code == 503:
        error_type = "SERVICE_UNAVAILABLE"
        message = "Instagram hizmeti geçici olarak kullanılamıyor."
    else:
        message = f"HTTP Hatası: {status_code}"

    return LoginError(message, error_type, status_code, details)


def giris_yap(username, password, android_id, user_agent, device_id):
    android_id_yeni = android_id.strip()
    selected_user_agent = user_agent.strip()
    selected_device_id = device_id.strip()
    current_timestamp = time.time()

    logger.info("Giris denemesi: @%s", username)

    nav_chain = (
        f"SelfFragment:self_profile:2:main_profile:{current_timestamp:.3f}::,"
        f"ProfileMediaTabFragment:self_profile:3:button:{current_timestamp + 0.287:.3f}::,"
        f"SettingsScreenFragment:ig_settings:4:button:{current_timestamp + 2.284:.3f}::,"
        f"com.bloks.www.caa.login.aymh_single_profile_screen_entry:"
        f"com.bloks.www.caa.login.aymh_single_profile_screen_entry:6:button:{current_timestamp + 0.308:.3f}::"
    )

    headers = {
        "x-ig-app-locale": "tr_TR",
        "x-ig-device-locale": "tr_TR",
        "x-ig-mapped-locale": "tr_TR",
        "x-bloks-version-id": "af73ae8cc48182fdcaf2eb0beac7935cb25fd05d18118022cd3f433a4b04e459",
        "x-bloks-is-prism-enabled": "true",
        "x-bloks-prism-button-version": "PROPOSAL_A",
        "x-bloks-prism-colors-enabled": "false",
        "x-bloks-prism-font-enabled": "false",
        "x-ig-attest-params": '{"attestation":[{"version":2,"type":"keystore","errors":[],"challenge_nonce":"","signed_nonce":"","key_hash":""}]}',
        "x-bloks-is-layout-rtl": "false",
        "x-ig-device-id": selected_device_id,
        "x-ig-android-id": f"android-{android_id_yeni}",
        "x-ig-timezone-offset": "10800",
        "x-ig-nav-chain": nav_chain,
        "x-fb-connection-type": "WIFI",
        "x-ig-connection-type": "WIFI",
        "x-ig-capabilities": "3brTv10=",
        "x-ig-app-id": "567067343352427",
        "priority": "u=3",
        "user-agent": selected_user_agent,
        "accept-language": "tr-TR, en-US",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "x-fb-http-engine": "Liger",
        "x-fb-client-ip": "True",
        "x-fb-server-cluster": "True",
    }

    data = {
        "params": (
            '{"client_input_params":{'
            '"should_show_nested_nta_from_aymh":1,'
            '"device_id":"android-'
            + android_id_yeni
            + '",'
            '"login_attempt_count":1,'
            '"secure_family_device_id":"",'
            '"machine_id":"'
            + android_id_yeni
            + '",'
            '"accounts_list":[{'
            '"uid":"",'
            '"credential_type":"none",'
            '"token":""},'
            '{"credential_type":"google_oauth",'
            '"account_type":"google_oauth",'
            '"token":""}],'
            '"auth_secure_device_id":"",'
            '"has_whatsapp_installed":1,'
            '"password":"#PWD_INSTAGRAM:0:0:'
            + password
            + '",'
            '"sso_token_map_json_string":"{\\"62428590454\\":[]}\",'
            '"family_device_id":"'
            + selected_device_id
            + '",'
            '"fb_ig_device_id":[],'
            '"device_emails":[""],'
            '"try_num":1,'
            '"lois_settings":{"lois_token":"","lara_override":""},'
            '"event_flow":"login_manual",'
            '"event_step":"home_page",'
            '"headers_infra_flow_id":"",'
            '"openid_tokens":{"":""},'
            '"client_known_key_hash":"",'
            '"contact_point":"'
            + username
            + '",'
            '"encrypted_msisdn":""},'
            '"server_params":{'
            '"should_trigger_override_login_2fa_action":0,'
            '"is_from_logged_out":1,'
            '"should_trigger_override_login_success_action":0,'
            '"login_credential_type":"none",'
            '"server_login_source":"login",'
            '"waterfall_id":"'
            + selected_device_id
            + '",'
            '"login_source":"Login",'
            '"is_platform_login":0,'
            '"INTERNAL__latency_qpl_marker_id":36707139,'
            '"offline_experiment_group":"caa_iteration_v3_perf_ig_4",'
            '"is_from_landing_page":0,'
            '"password_text_input_id":"9xrg1k:86",'
            '"is_from_empty_password":0,'
            '"ar_event_source":"login_home_page",'
            '"qe_device_id":"'
            + selected_device_id
            + '",'
            '"username_text_input_id":"9xrg1k:85",'
            '"layered_homepage_experiment_group":null,'
            '"device_id":"android-'
            + android_id_yeni
            + '",'
            '"INTERNAL__latency_qpl_instance_id":6.0090341600153E13,'
            '"reg_flow_source":"aymh_single_profile_native_integration_point",'
            '"is_caa_perf_enabled":1,'
            '"credential_type":"password",'
            '"caller":"gslr",'
            '"family_device_id":null,'
            '"INTERNAL_INFRA_THEME":"harm_f",'
            '"access_flow_version":"F2_FLOW",'
            '"is_from_logged_in_switcher":0}}'
        ),
        "bk_client_context": (
            '{"bloks_version":"af73ae8cc48182fdcaf2eb0beac7935cb25fd05d18118022cd3f433a4b04e459",'
            '"styles_id":"instagram"}'
        ),
        "bloks_versioning_id": "af73ae8cc48182fdcaf2eb0beac7935cb25fd05d18118022cd3f433a4b04e459",
    }

    response = None
    try:
        response = curl_requests.post(
            "https://i.instagram.com/api/v1/bloks/apps/com.bloks.www.bloks.caa.login.async.send_login_request/",
            headers=headers,
            data=data,
            timeout=15,
            impersonate="chrome_android",
        )
    except (ConnectionError, TimeoutError) as error:
        logger.error("Ağ bağlantısı hatası: %s", str(error))
        raise LoginError(
            "İnternet bağlantısı sağlanamadı veya istek zaman aşımına uğradı. Bağlantınızı kontrol edin.",
            "NETWORK_ERROR",
            details={"original_error": str(error), "error_type": type(error).__name__}
        )
    except Exception as error:
        error_type = type(error).__name__
        logger.error("Beklenmeyen hata: %s | Tip: %s", str(error), error_type)
        
        if "Connection" in error_type:
            raise LoginError(
                "Instagram sunucusuna bağlanılamadı.",
                "CONNECTION_ERROR",
                details={"original_error": str(error)}
            )
        elif "Timeout" in error_type:
            raise LoginError(
                "İstek zaman aşımına uğradı.",
                "TIMEOUT",
                details={"original_error": str(error)}
            )
        else:
            raise LoginError(
                f"Beklenmeyen hata: {str(error)}",
                "UNKNOWN",
                details={"error_type": error_type, "original_error": str(error)}
            )

    if response is None:
        logger.error("Response nesnesi oluşturulamadı")
        raise LoginError("Sunucudan yanıt alınamadı", "NO_RESPONSE")

    logger.info("Response Status Code: %d", response.status_code)

    if response.status_code >= 400:
        error = _handle_http_error(response.status_code, response.text)
        logger.error("HTTP hatası: %s | Durum kodu: %d", error.message, response.status_code)
        raise error

    yeni = None
    try:
        yeni = response.json()
        logger.debug("Response JSON: %s", json.dumps(yeni, indent=2, ensure_ascii=False))
    except json.JSONDecodeError as parse_error:
        logger.error("JSON Parse Hatası: %s | Response: %s", parse_error, response.text[:500])
        raise LoginError(
            "Instagram yanıtı okunamadı.",
            "JSON_PARSE_ERROR",
            details={"parse_error": str(parse_error), "response_preview": response.text[:200]}
        )
    except Exception as parse_error:
        logger.error("Beklenmeyen parse hatası: %s", str(parse_error))
        raise LoginError(
            f"Yanıt işlenirken hata: {str(parse_error)}",
            "PARSE_ERROR",
            details={"original_error": str(parse_error)}
        )

    def find_bearer_token(payload):
        token_pattern = re.compile(r"Bearer IGT:[a-zA-Z0-9:_\-]+")

        if isinstance(payload, dict):
            for value in payload.values():
                if isinstance(value, str):
                    match = token_pattern.search(value)
                    if match:
                        return match.group(0)
                elif isinstance(value, (dict, list)):
                    result = find_bearer_token(value)
                    if result:
                        return result
        elif isinstance(payload, list):
            for item in payload:
                result = find_bearer_token(item)
                if result:
                    return result
        return None

    bearer_token = find_bearer_token(yeni)

    if bearer_token:
        logger.info("Token bulundu: @%s", username)
        time.sleep(random.uniform(0.5, 1.5))
    else:
        logger.warning("Token bulunamadi: @%s", username)
        
        error_message = _extract_login_failure_reason(yeni)
        if error_message:
            logger.error("Giriş başarısız nedeni: %s", error_message)
            raise LoginError(
                error_message,
                "LOGIN_FAILED",
                details={"response": str(yeni)[:500]}
            )
        
        raise LoginError(
            "Token alınamadı. Kullanıcı adı veya şifre hatalı olabilir.",
            "TOKEN_NOT_FOUND",
            details={"response": str(yeni)[:500]}
        )

    save_token_data(
        {
            "token": bearer_token,
            "android_id_yeni": android_id_yeni,
            "user_agent": selected_user_agent,
            "device_id": selected_device_id,
        }
    )

    return bearer_token, android_id_yeni, selected_user_agent, selected_device_id
