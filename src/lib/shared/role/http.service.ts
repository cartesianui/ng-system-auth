import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IHttpService, HttpService, POST, GET, Body, Criteria, DefaultHeaders, RequestCriteriaOuput, Path, Query, DELETE, PUT, ICartesianResponse } from '@cartesianui/platform-core';
import { Role, RolePermissions } from '../../models';

export type IRoleHttpServiceExtension = {
  getRolePermissions: (id: string, criteria: RequestCriteriaOuput) => Observable<ICartesianResponse>;
  attachPermission: (id: string, form: RolePermissions) => Observable<ICartesianResponse>;
  syncPermissions: (id: string, form: RolePermissions) => Observable<ICartesianResponse>;
  detachPermission: (id: string, form: RolePermissions) => Observable<ICartesianResponse>;
};

@Injectable()
@DefaultHeaders({
  Accept: 'application/json',
  'Content-Type': 'application/json'
})
export class RoleHttpService extends HttpService implements IHttpService<Role, IRoleHttpServiceExtension> {

  @GET('/roles')
  public getAll(@Criteria criteria: RequestCriteriaOuput): Observable<any> {
    return null;
  }

  @GET('/roles/{id}')
  public getById(@Path('id') id: string, @Query('include') includes?: string): Observable<any> {
    return null;
  }

  @POST('/roles')
  public create(@Body body: Role): Observable<any> {
    return null;
  }

  @PUT('/roles/{id}')
  public update(@Path('id') id: string, @Body body: Partial<Role>): Observable<any> {
    return null;
  }

  @DELETE('/roles/{id}')
  public delete(@Path('id') id: string): Observable<any> {
    return null;
  }

  @GET('/roles/{id}/permissions')
  public getRolePermissions(@Path('id') id: string, @Criteria criteria: RequestCriteriaOuput): Observable<any> {
    return null;
  }

  @POST('/roles/{id}/permissions')
  public attachPermission(@Path('id') id: string, @Body form: RolePermissions): Observable<any> {
    return null;
  }

  @PUT('/roles/{id}/permissions')
  public syncPermissions(@Path('id') id: string, @Body form: RolePermissions): Observable<any> {
    return null;
  }

  @DELETE('/roles/{id}/permissions')
  public detachPermission(@Path('id') id: string, @Body form: RolePermissions): Observable<any> {
    return null;
  }
}
