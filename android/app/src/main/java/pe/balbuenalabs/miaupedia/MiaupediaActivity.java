package pe.balbuenalabs.miaupedia;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import com.google.androidbrowserhelper.trusted.LauncherActivity;

public final class MiaupediaActivity extends LauncherActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        retainMiaupediaLink(getIntent());
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        retainMiaupediaLink(intent);
        super.onNewIntent(intent);
    }

    private static void retainMiaupediaLink(Intent intent) {
        Uri link = intent.getData();
        if (link == null) {
            return;
        }
        if (!"https".equalsIgnoreCase(link.getScheme()) ||
                !"miaupedia.vercel.app".equalsIgnoreCase(link.getHost()) ||
                link.getUserInfo() != null ||
                (link.getPort() != -1 && link.getPort() != 443)) {
            intent.setData(null);
        }
    }
}
