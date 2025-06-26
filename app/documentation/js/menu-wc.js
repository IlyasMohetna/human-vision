'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">app documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AdminModule.html" data-type="entity-link" >AdminModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AdminRoutingModule.html" data-type="entity-link" >AdminRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AuthModule.html" data-type="entity-link" >AuthModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/DashboardModule.html" data-type="entity-link" >DashboardModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-DashboardModule-cd634648448c16c4a90114951f4ee2a2a395b4668631d172c0e214c9de14a33210cb887420122b7d45aa4b8d8603dffc52c8f807a79bfe0e0de18e8624f71ea4"' : 'data-bs-target="#xs-components-links-module-DashboardModule-cd634648448c16c4a90114951f4ee2a2a395b4668631d172c0e214c9de14a33210cb887420122b7d45aa4b8d8603dffc52c8f807a79bfe0e0de18e8624f71ea4"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-DashboardModule-cd634648448c16c4a90114951f4ee2a2a395b4668631d172c0e214c9de14a33210cb887420122b7d45aa4b8d8603dffc52c8f807a79bfe0e0de18e8624f71ea4"' :
                                            'id="xs-components-links-module-DashboardModule-cd634648448c16c4a90114951f4ee2a2a395b4668631d172c0e214c9de14a33210cb887420122b7d45aa4b8d8603dffc52c8f807a79bfe0e0de18e8624f71ea4"' }>
                                            <li class="link">
                                                <a href="components/HomeComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HomeComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/DashboardRoutingModule.html" data-type="entity-link" >DashboardRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/UserModule.html" data-type="entity-link" >UserModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/UserRoutingModule.html" data-type="entity-link" >UserRoutingModule</a>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AnnotationCategoryComponent.html" data-type="entity-link" >AnnotationCategoryComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AppComponent.html" data-type="entity-link" >AppComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BadgeComponent.html" data-type="entity-link" >BadgeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CommentModalComponent.html" data-type="entity-link" >CommentModalComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ControlBarComponent.html" data-type="entity-link" >ControlBarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ControlBarItemComponent.html" data-type="entity-link" >ControlBarItemComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DashboardLayoutComponent.html" data-type="entity-link" >DashboardLayoutComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DatasetComponent.html" data-type="entity-link" >DatasetComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HomeComponent.html" data-type="entity-link" >HomeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HomeComponent-1.html" data-type="entity-link" >HomeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ImportComponent.html" data-type="entity-link" >ImportComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LeftSideBarComponent.html" data-type="entity-link" >LeftSideBarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LoadingOverlayComponent.html" data-type="entity-link" >LoadingOverlayComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MapComponent.html" data-type="entity-link" >MapComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MetadataComponent.html" data-type="entity-link" >MetadataComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RightSideBarComponent.html" data-type="entity-link" >RightSideBarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SettingsComponent.html" data-type="entity-link" >SettingsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SidebarComponent.html" data-type="entity-link" >SidebarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/StudioComponent.html" data-type="entity-link" >StudioComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TrafficSignsComponent.html" data-type="entity-link" >TrafficSignsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/VariantsComponent.html" data-type="entity-link" >VariantsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/VehicleComponent.html" data-type="entity-link" >VehicleComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WeatherComponent.html" data-type="entity-link" >WeatherComponent</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AnnotationService.html" data-type="entity-link" >AnnotationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/KeyboardService.html" data-type="entity-link" >KeyboardService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ModuleLoaderService.html" data-type="entity-link" >ModuleLoaderService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PolygonDataService.html" data-type="entity-link" >PolygonDataService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ThemeService.html" data-type="entity-link" >ThemeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserService.html" data-type="entity-link" >UserService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#guards-links"' :
                            'data-bs-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/AuthGuard.html" data-type="entity-link" >AuthGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/GuestGuard.html" data-type="entity-link" >GuestGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/RoleGuard.html" data-type="entity-link" >RoleGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/UserResolver.html" data-type="entity-link" >UserResolver</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/BoundingBox.html" data-type="entity-link" >BoundingBox</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Dataset.html" data-type="entity-link" >Dataset</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaginationInfo.html" data-type="entity-link" >PaginationInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PolygonData.html" data-type="entity-link" >PolygonData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PolygonDataMap.html" data-type="entity-link" >PolygonDataMap</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PolygonResponse.html" data-type="entity-link" >PolygonResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TrafficSignResponse.html" data-type="entity-link" >TrafficSignResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TrafficSignResult.html" data-type="entity-link" >TrafficSignResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User.html" data-type="entity-link" >User</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});