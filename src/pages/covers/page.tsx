import MainLayout from '../../components/layout/MainLayout';
import CoversFileManager from '../../components/covers/CoversFileManager';

export default function CoversPage() {
    return (
        <MainLayout>
            <div className="w-full p-4 lg:p-6">
                <CoversFileManager />
            </div>
        </MainLayout>
    );
}
