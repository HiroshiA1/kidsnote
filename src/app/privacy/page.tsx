'use client';

export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>

            <div className="space-y-8 text-gray-700 leading-relaxed">
                {/* 1. 基本方針 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">1. 基本方針</h2>
                    <p>
                        本サービス「KidsNote」（以下「本サービス」）は、園児・保護者・職員の個人情報を適切に管理し、
                        個人情報の保護に関する法律（個人情報保護法）およびその他の関連法令を遵守します。
                    </p>
                </section>

                {/* 2. 収集する情報 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">2. 収集する個人情報</h2>
                    <p className="mb-2">本サービスでは、以下の個人情報を収集・利用します。</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li><strong>園児情報</strong>：氏名、生年月日、性別、クラス、アレルギー情報、特性、成長記録</li>
                        <li><strong>保護者情報</strong>：氏名、電話番号、続柄（緊急連絡先として）</li>
                        <li><strong>職員情報</strong>：氏名、メールアドレス、電話番号、資格情報、勤務情報</li>
                        <li><strong>出席・出勤情報</strong>：園児の出席記録、職員の出勤記録</li>
                        <li><strong>操作ログ</strong>：システム利用に関する監査ログ</li>
                    </ul>
                </section>

                {/* 3. 利用目的 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">3. 利用目的</h2>
                    <p className="mb-2">収集した個人情報は、以下の目的のみに利用します。</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>園児の保育・教育に関する業務の遂行</li>
                        <li>成長記録・保育計画の作成と管理</li>
                        <li>出席管理・シフト管理等の業務運営</li>
                        <li>保護者への連絡・報告</li>
                        <li>ヒヤリハット・事故記録の管理と安全対策</li>
                        <li>AI による入力支援（テキスト分類機能）</li>
                    </ul>
                </section>

                {/* 4. 外部AIサービスの利用 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">4. 外部 AI サービスの利用</h2>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                        <p className="text-blue-800 font-medium mb-2">🤖 AI テキスト分類機能について</p>
                        <p className="text-blue-700 text-sm">
                            本サービスでは Google Gemini API を利用して入力テキストの自動分類を行います。
                            <strong>個人名は匿名化（仮名に置換）してから送信し、外部サービスに実名が送信されることはありません。</strong>
                        </p>
                    </div>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>利用サービス：Google Gemini API</li>
                        <li>送信データ：匿名化済みの入力テキスト（園児名・職員名は仮名に置換）</li>
                        <li>利用目的：テキストの意図分類（成長記録・ヒヤリハット・申し送り等の識別）</li>
                        <li>データ保持：API リクエスト処理のためのみ利用し、Google による学習には使用されません</li>
                    </ul>
                </section>

                {/* 5. データの保管 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">5. データの保管と保護</h2>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>データは暗号化された通信（HTTPS）を通じて送受信されます</li>
                        <li>ブラウザに一時保存されるデータは AES-GCM 暗号化により保護されます</li>
                        <li>データベースにはアクセス制御（行レベルセキュリティ）が設定されており、
                            所属する組織のデータのみアクセス可能です</li>
                        <li>操作はすべて監査ログに記録されます</li>
                    </ul>
                </section>

                {/* 6. 第三者提供 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">6. 第三者への提供</h2>
                    <p>
                        法令に基づく場合を除き、ご本人の同意なく個人情報を第三者に提供することはありません。
                        ただし、上記「4. 外部 AI サービスの利用」に記載の匿名化データの送信を除きます。
                    </p>
                </section>

                {/* 7. データの削除 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">7. データの削除・訂正</h2>
                    <p>
                        ご本人または保護者から個人情報の開示・訂正・削除の請求があった場合、
                        合理的な期間内に対応いたします。請求は園の管理者までご連絡ください。
                    </p>
                </section>

                {/* 8. 改定 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">8. ポリシーの改定</h2>
                    <p>
                        本ポリシーは、法令の改正やサービスの変更に応じて改定することがあります。
                        改定した場合は、本ページにて最新の内容を掲載します。
                    </p>
                </section>

                <div className="border-t pt-6 text-sm text-gray-500">
                    <p>最終更新日：2026年2月27日</p>
                </div>
            </div>
        </div>
    );
}
