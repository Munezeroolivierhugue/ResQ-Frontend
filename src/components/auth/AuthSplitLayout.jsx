import { AuthBrandPanel, AuthFormFooter } from './AuthShared'



export default function AuthSplitLayout({

  children,

  showBrand = true,

  showTabs,

  showFormFooter = true,

}) {

  return (

    <div className="auth-page auth-page--embedded">

      <div className="auth-split auth-split--half">

        {showBrand && <AuthBrandPanel />}



        <div className="auth-form-panel">

          <div className="auth-form-scroll">

            <div className="auth-form-inner">

              {showTabs}

              {children}

              {showFormFooter && <AuthFormFooter />}

            </div>

          </div>

        </div>

      </div>

    </div>

  )

}


