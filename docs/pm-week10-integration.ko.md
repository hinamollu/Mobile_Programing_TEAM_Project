# 10주차 PM 기능 통합 안내 (2026-11-11 ~ 2026-11-17)

## 기준과 구현 범위
다운로드 폴더의 프로젝트_제안서_14팀.pdf 전체 13쪽을 읽고 시안과 흐름도를 확인했다.
5쪽 흐름도, 8쪽 프로젝트 목록, 9쪽 프로젝트 메인을 기능 기준으로 삼았다.
개인/공유 구분, 프로젝트 이름·배치안 수, 프로젝트 수정·삭제 메뉴, 배치안 이름·가구 수·배치하기·복제·삭제, 하단 추가 동작을 구현했다.
문서에는 배치안 생성 폼의 상세 입력이 없어 이름만 필수(공백 제외, 최대 60자)로 받는다.
사용자 요청에 따라 목록은 개인/공유 섹션으로 구분한다. 민트/청록과 밝은 배경, 둥근 카드를 사용한다.
시안의 방 썸네일은 새 로컬 벡터로 단순화했고 작은 화면을 위해 카드 버튼은 세로로 배치했다. 실제 렌더링은 미검증이다.
실제 가구 배치 편집기, 공통 하단 내비게이션, 전역 방/가구 관리, 인증, Firebase 공유는 포함하지 않는다.

## 새 파일 (기존 파일 수정 없음)
- app/src/main/java/com/mobileprograming/teamproject/feature/project/PmProjectFragment.kt
- app/src/main/java/com/mobileprograming/teamproject/feature/project/PmProjectState.kt
- app/src/main/res/layout/pm_fragment_projects.xml
- app/src/main/res/layout/pm_item_card.xml
- app/src/main/res/layout/pm_dialog_name.xml
- app/src/main/res/drawable/pm_card.xml
- app/src/main/res/drawable/pm_room.xml
- app/src/main/res/drawable/pm_trash.xml
- app/src/main/res/values/pm_colors.xml
- app/src/main/res/values/pm_strings.xml
- docs/pm-week10-integration.ko.md (이 문서)

## 진입과 화면 전환
진입 Fragment는 com.mobileprograming.teamproject.feature.project.PmProjectFragment이다.
팀 통합 시 공용 Navigation graph에 진입 목적지를 추가한다. 이번 작업에서는 공용 graph, MainActivity, Manifest, Gradle을 변경하지 않았다.
목록 → 프로젝트 → 배치안의 선택 가구 화면은 한 Fragment의 내부 상태로 전환된다.
상단 뒤로 및 시스템 뒤로는 가구 → 프로젝트 → 목록 순서로 이동한다. 목록에서 시스템 뒤로는 호스트에 위임한다.
Fragment 범위 ViewModel을 사용하므로 회전/뷰 재생성 중 메모리 상태를 유지한다.
대화상자는 onDestroyView에서 닫으며 진행 중 입력은 재생성 후 복원하지 않는다.

## 외부 내비게이션 계약
PmProjectNavigation을 가장 가까운 상위 Fragment 또는 Activity에서 구현한다.
- onPmPlaceFurniture(projectId: String, planId: String, furniture: List<PmFurnitureUiModel>)
- onPmShareProject(projectId: String)
배치하기는 현재 선택 가구의 스냅샷을 전달한다. 공유는 프로젝트 ID만 전달한다.
콜백 미연결 시 안내 Toast를 표시한다. 실제 편집기/공유 기능으로 넘어가지 않는다.
프로젝트/배치안 ID는 임시 ID이므로 백엔드 영구 ID로 취급하지 않는다.
호스트가 전역 툴바/인셋을 책임진다. 해당 Fragment 자체에 제목과 뒤로 버튼이 있다.
공용 그래프 통합 시 내부 경로를 별도 목적지로 나누려면 팀 합의 후 내부 상태 이동을 Navigation 액션으로 교체한다.

## UI 모델과 Mock Data
PmProjectUiModel(id, name, shared, plans), PmLayoutPlanUiModel(id, name, furnitureIds),
PmFurnitureUiModel(id, name, category)는 feature-local UI 전용 모델이다. Room 엔티티가 아니다.
PmProjectState에는 개인 침실(남향/동향 배치안, 가구 3/4개), 공유 작은방(3개 배치안), 가구 카탈로그 4개가 있다.
추가 프로젝트와 배치안, 복제본은 UUID를 사용한다. 복제 이름은 '(복사 N)'으로 구별한다.
복제본의 가구 ID 목록은 별도 목록으로 만들고 모든 수정은 copy로 처리한다.
선택 화면의 추가는 해당 배치안에 없는 카탈로그 가구만 표시하며 확인 시 반영, 취소 시 미반영한다.
선택 해제는 배치안의 연결만 제거하며 카탈로그를 삭제하지 않는다.
프로젝트 공유 여부 편집은 임시 분류 변경일 뿐 실제 권한이나 초대가 아니다.

## 백엔드 연결 및 제한
현재 Room/Firebase/Repository 호출, 인증 의존성, 파일 저장은 없다.
프로세스 종료, 진입 Fragment 제거 후 새 인스턴스 생성 시 상태가 초기화될 수 있다. 영구 저장을 보장하지 않는다.
백엔드 담당자가 확정한 Repository를 ViewModel에 연결하고 공유 모델 → UI 모델 매핑, 실제 ID, 로딩/실패 상태, 권한 검사를 추가해야 한다.
단일 사용자 메모리 흐름이므로 동시 편집/동기화/초대 처리를 지원하지 않는다.
목록/상세/가구 선택은 준비된 소스이고 현재 앱의 HomeFragment와 연결하지 않았다.

## 수행한 검증과 팀 확인 항목
사용자 최종 제한에 따라 Gradle 빌드/테스트, APK/AAB 생성, 설치, 앱 실행, 별도 실행 호스트를 만들지 않았다.
XML 8개 파싱, pm_ 참조 89건 해석, Kotlin 패키지·import·콜백·상태 변경 흐름을 정적으로 검사했다.
컴파일 및 런타임 동작은 검증하지 않았다. 정적 리소스 검사 성공은 앱 테스트 통과를 뜻하지 않는다.
통합 후 팀에서 다음을 확인한다:
1. 개인/공유 목록과 빈 상태, 올바른 프로젝트 선택, 수정 후 섹션 이동, 삭제 취소/확인
2. 배치안 생성(빈 이름 차단), 연속 복제의 이름/ID, 복제본 가구 수정 시 원본 유지
3. 배치안 삭제 취소/확인, 정확한 가구 목록, 추가 취소/확인 및 제거 후 개수 갱신
4. 화면 및 시스템 뒤로, 회전, 외부 콜백의 ID/가구 전달, 콜백 미연결 안내
5. 작은 화면·큰 글꼴·TalkBack·다크 테마 및 기존 기능 회귀
발견 이슈는 요청에 따라 최종 개발 보고에만 기록한다. 앱 내 버그 보고 기능은 없다.

## 병합 준비
새 파일만 추가했으며 리소스에 pm_ 접두사를 사용했다. 기존 .idea, README, 임시 공유 파일은 건드리지 않았다.
공유 파일 충돌 가능성은 낮지만 추후 내비게이션 연결은 프론트엔드 담당자와 조율해야 한다.
기존 저장소의 미추적 파일들은 이번 기능 추가 전부터 존재했다. 기능 파일만 구분해서 리뷰한다.
스테이징, 커밋, 푸시, 브랜치 변경을 수행하지 않았다.


## 추가 실행 검증 (2026-11-16, 사용자의 후속 실행 요청)
앞 절의 미실행 표기는 최초 소스 전용 작업 당시의 결과다. 후속 요청으로 아래 검증을 수행했다.
원본 공용 파일을 보존하기 위해 작업 폴더 tmp/pm-runtime-check 사본에서 진입 Activity를 연결했다.
검증 앱 ID는 com.mobileprograming.teamproject.pmcheck이며 기존 앱을 덮어쓰지 않았다.
실행한 사본의 기능 Kotlin/XML 10개가 원본 기능 파일과 일치함을 바이트 비교했다.
JDK 21, Gradle Wrapper 8.13 :app:assembleDebug 성공. Pixel 8 / API 36 부팅 및 검증 앱 설치·실행 성공.
ADB UI 계층 기반 조작으로 목록의 개인/공유 구분, 침실/작은방 전환, 상세 카드 정보,
이름 없는 배치안 저장 차단, 배치안 생성·복제·삭제 확인/취소, 가구 선택·추가 취소·추가·제거·개수 갱신,
복제 후 가구 연결의 독립성, 뒤로 이동을 검증했다.
배치하기와 공유 콜백은 검증 호스트의 로그에서 project/plan ID 및 가구 목록 전달을 확인했다.
최종 보조 버튼 색상을 스크린샷으로 확인했다. 검증 중 adb logcat -b crash 결과는 비어 있었다.
이 검증은 단위 테스트/계측 테스트 스위트 실행이 아니며 기존 앱 전체 회귀, 백엔드·편집기·공유 실제 화면,
프로세스 종료 후 복원, 다크 모드·큰 글꼴·접근성은 검증하지 않았다.

에뮬레이터 실행 재현용 docs/pm-start-emulator.ps1을 추가했다.
PowerShell에서 ./docs/pm-start-emulator.ps1 로 실행한다. SDK 경로는 ANDROID_HOME 또는 기본 LOCALAPPDATA를 사용한다.
이 런처는 자식 실행의 PATH에 emulator 및 lib64만 추가하고 종료 시 기존 PATH를 복원한다.
전역 환경변수와 기존 android-env.ps1, .idea, README를 수정하지 않는다.


## 하단 바 및 PDF 디자인 반영 (후속 요청)
기존 진입 설명에 추가하여, 하단 바를 포함하는 새 진입점은
com.mobileprograming.teamproject.feature.project.PmWorkspaceFragment이다.
PmProjectFragment는 기존처럼 배치 탭의 내용만 독립적으로 사용할 수 있다.
원본 MainActivity/공용 Navigation graph/Manifest/Gradle/.idea/README는 수정하지 않았다.
검증용 사본의 호스트만 PmWorkspaceFragment로 연결했다.

하단 바: 방 / 가구 / 배치 / 마이페이지. 최초 선택은 배치다.
방·가구·마이페이지는 중앙 회색 문구 '팀원 개발안 넣을 공간'만 표시하는
PmTeammatePlaceholderFragment를 사용한다.
탭 전환 시 프로젝트 ViewModel과 내부 경로를 유지하며, 다른 탭에서 시스템 뒤로를 누르면 배치로 돌아온다.
탭 선택은 인스턴스 상태에 저장한다. 메모리 데이터의 프로세스 종료 후 영구 복원은 지원하지 않는다.

팀원 화면 연결: PmWorkspaceDestinations를 상위 Fragment 또는 Activity에 구현하고
createPmTab(tab: PmWorkspaceTab): Fragment? 에서 ROOM/FURNITURE/MYPAGE에 해당하는 Fragment를 반환한다.
null이면 안내 화면이 표시된다. PROJECTS는 기존 PmProjectFragment를 그대로 사용한다.
기존 PmProjectNavigation의 배치하기/공유 계약은 바뀌지 않았다.
호스트가 이미 하단 바를 제공한다면 PmProjectFragment만 연결하여 중복 바를 피한다.

버튼은 시안 기준으로 재배치했다:
- 프로젝트 카드 전체 클릭으로 진입, 우측 상단 ⋯로 기존 관리 메뉴 제공.
- 상세 카드의 좌측 썸네일, 중앙 이름/가구 수, 우측 배치하기/복제, 우측 상단 삭제.
- 뒤로/공유는 상단 아이콘, 추가는 우측 하단 원형 +, 복제는 밝은 배경의 테두리 버튼.
- 기능 전용 스타일로 전역 테마 색상의 영향을 줄이고 민트/청록을 적용했다.

픽셀 단위의 절대 좌표는 PDF에 수치가 없어 확정할 수 없다.
화면 밀도/크기가 달라도 위치 관계를 유지하도록 dp와 가장자리 기준 정렬을 사용했다.
기존 개인/공유 구분 기능은 섹션으로 유지했다. 방 썸네일은 시안의 원본 이미지 에셋이 없어 로컬 벡터로 재현했다.
배치안 생성/가구 선택 다이얼로그는 전용 PDF 시안이 없어 기존 입력·확인·취소 흐름을 유지하고 청록 색상을 적용했다.
긴 제목은 상단 공간을 넘기면 말줄임 처리하며 데이터 자체는 유지한다.
PDF의 검색/상단 전체 메뉴는 이번 기존 기능의 버튼 디자인 변경 범위에 포함하지 않았다.

변경 파일: PmProjectFragment.kt, pm_fragment_projects.xml, pm_item_card.xml, pm_room.xml,
pm_strings.xml 및 이 문서.
추가 파일: PmWorkspaceFragment.kt, pm_fragment_placeholder.xml,
pm_item_project.xml, pm_item_furniture.xml, pm_item_section.xml, pm_styles.xml,
pm_outline.xml, pm_count_background.xml, pm_primary_background.xml, pm_tab_background.xml,
pm_back.xml, pm_share.xml, pm_plus.xml, pm_more.xml, pm_home.xml, pm_furniture.xml,
pm_grid.xml, pm_grid_small.xml, pm_person.xml 및 하단 바 레이아웃.
하단 바 레이아웃 실제 파일: pm_fragment_workspace.xml.

추가 검증 결과: 최종 사본의 Gradle 디버그 빌드 성공, Pixel 8/API 36에서 네 탭 이동과
안내 문구, 탭 간 프로젝트 경로/데이터 유지, 시스템 뒤로, 프로젝트 관리 메뉴,
배치안 생성·복제·삭제 확인/취소, 복제본 가구 변경의 독립성, 가구 수 갱신 및 외부 콜백을 확인했다.
스크린샷으로 카드/하단 바/플로팅 추가 버튼/가구 수 버튼을 확인했다.
XML 27개와 리소스 참조를 검사했고, 원본 기능 소스와 실행 사본의 일치를 확인했다.
스테이징·커밋·푸시는 수행하지 않았다. 기존 앱 전체 및 팀원 기능의 통합 회귀는 미검증이다.
